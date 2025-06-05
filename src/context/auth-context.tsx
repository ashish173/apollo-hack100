"use client";

import type { User } from 'firebase/auth';
import { signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { ReactNode} from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth as firebaseAuthService, db as firebaseDbService, googleAuthProvider, firebaseInitializationError } from '@/lib/firebase';
import type { UserProfile, UserRole } from '@/types';


interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  authError: string | null;
  roleMismatchError: string | null;
  signInWithGoogle: (role: UserRole) => Promise<void>;
  signOutUser: () => Promise<void>;
  clearAuthError: () => void;
  clearRoleMismatchError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [roleMismatchError, setRoleMismatchError] = useState<string | null>(null);
  const [initializationErrorMsg, setInitializationErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const clearAuthError = () => {
    setAuthError(null);
  };

  const clearRoleMismatchError = () => {
    setRoleMismatchError(null);
  };

  useEffect(() => {
    if (firebaseInitializationError) {
      setInitializationErrorMsg(`Firebase initialization error: ${firebaseInitializationError.message}`);
      setLoading(false);
      return;
    }

    if (!firebaseAuthService) {
      setInitializationErrorMsg("Firebase Auth service could not be initialized. Please check your configuration and ensure all necessary Firebase environment variables are set in .env.local.");
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(firebaseAuthService, async (firebaseUser: User | null) => {
      setLoading(true); 
      if (firebaseUser) {
        if (!firebaseDbService) {
          setInitializationErrorMsg("Firebase Firestore service is not available. Cannot fetch user profile.");
          await firebaseSignOut(firebaseAuthService); // Sign out if DB is unusable
          setUser(null);
          setLoading(false); // Explicitly set loading false
          return;
        }
        const userDocRef = doc(firebaseDbService, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const firestoreData = userDocSnap.data();
          const roleFromDb = firestoreData?.role as UserRole | undefined;

          if (roleFromDb && (roleFromDb === 'teacher' || roleFromDb === 'student')) {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email || firestoreData?.email,
              displayName: firebaseUser.displayName || firestoreData?.displayName,
              photoURL: firebaseUser.photoURL || firestoreData?.photoURL, // Add this
              role: roleFromDb,
            });
            setLoading(false);

            // Optionally, update Firestore if Google photoURL is newer and different
            // This is a good place if you want to keep Firestore updated even if the user doesn't re-authenticate via Google button
            const googlePhotoURL = firebaseUser.photoURL;
            if (googlePhotoURL && googlePhotoURL !== firestoreData?.photoURL) {
              try {
                await setDoc(userDocRef, { photoURL: googlePhotoURL }, { merge: true });
                console.log(`onAuthStateChanged: Updated photoURL for user ${firebaseUser.uid}`);
              } catch (error) {
                console.error(`onAuthStateChanged: Error updating photoURL for user ${firebaseUser.uid}:`, error);
              }
            }

          } else {
            console.warn(`User ${firebaseUser.uid} (onAuthStateChanged) document exists but role is missing or invalid: "${roleFromDb}". Clearing user session.`);
            await firebaseSignOut(firebaseAuthService); // This will trigger onAuthStateChanged again with firebaseUser = null
            setUser(null); // Ensure local state is cleared
            // setLoading will be handled by the subsequent onAuthStateChanged(null)
            return; 
          }
        } else {
          console.warn(`User ${firebaseUser.uid} authenticated (onAuthStateChanged) but no Firestore record found. Clearing user session.`);
          await firebaseSignOut(firebaseAuthService); // This will trigger onAuthStateChanged again
          setUser(null);
          // setLoading will be handled by the subsequent onAuthStateChanged(null)
          return;
        }
      } else { // firebaseUser is null
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); 

  const signInWithGoogle = async (selectedRole: UserRole) => {
    clearAuthError();
    clearRoleMismatchError();

    if (initializationErrorMsg || !firebaseAuthService || !firebaseDbService) {
      console.log("Firebase service initialization failed or not available.");
      setAuthError("Authentication service is currently unavailable. Please try again later.");
      setLoading(false);
      return;
    }

    if (user && user.role !== selectedRole) {
      setRoleMismatchError(
        `You are trying to login with ${selectedRole} role. You are already Signed in with Role ${user.role}, please login with the same.`
      );
      try {
        await firebaseSignOut(firebaseAuthService);
        setUser(null);
      } catch (error) {
        console.error("Error signing out existing user during role mismatch:", error);
        setAuthError("Could not sign out existing session. Please try again.");
      }
      router.push('/login');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuthService, googleAuthProvider);
      const firebaseUser = result.user;
      const photoURL = firebaseUser.photoURL; 
      
      const userDocRef = doc(firebaseDbService, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userRole = selectedRole;
      let userEmail = firebaseUser.email;
      let userDisplayName = firebaseUser.displayName;

      if (userDocSnap.exists()) {
        const firestoreData = userDocSnap.data();
        const roleFromDb = firestoreData?.role as UserRole | undefined;
        
        userEmail = firebaseUser.email || firestoreData?.email;
        userDisplayName = firebaseUser.displayName || firestoreData?.displayName;

        if (roleFromDb && (roleFromDb === 'teacher' || roleFromDb === 'student')) {
            userRole = roleFromDb;
            if (userRole !== selectedRole) {
                console.warn(`Role mismatch: DB role is "${userRole}", selected role was "${selectedRole}".`);
                setRoleMismatchError(
                   `You are trying to login with ${selectedRole} role. You are already Signed in with Role ${userRole}, please login with the same.`
                );
                await firebaseSignOut(firebaseAuthService);
                setUser(null);
                router.push('/login');
                setLoading(false);
                return;
            } else {
                console.log(`Login successful. Role: ${userRole}`);
            }
            
            const currentPhotoURL = firebaseUser.photoURL;
            let needsUpdate = false;
            const updateData: { photoURL?: string | null, email?: string | null, displayName?: string | null, updatedAt?: any } = { updatedAt: serverTimestamp() };

            if (currentPhotoURL && currentPhotoURL !== firestoreData?.photoURL) {
                updateData.photoURL = currentPhotoURL;
                needsUpdate = true;
            }
            if (userEmail && userEmail !== firestoreData?.email) { 
                updateData.email = userEmail;
                needsUpdate = true;
            }
            if (userDisplayName && userDisplayName !== firestoreData?.displayName) { 
                updateData.displayName = userDisplayName;
                needsUpdate = true;
            }

            if (needsUpdate) {
              await setDoc(userDocRef, updateData, { merge: true });
              console.log(`signInWithGoogle: Updated user profile for ${firebaseUser.uid}`, updateData);
            }

        } else {
            console.warn(`User ${firebaseUser.uid} document exists but role is missing/invalid: "${roleFromDb}". Using selected role: ${selectedRole} and updating Firestore.`);
            userRole = selectedRole; 
            await setDoc(userDocRef, {
              uid: firebaseUser.uid, 
              email: userEmail,
              displayName: userDisplayName,
              photoURL: firebaseUser.photoURL,
              role: userRole,
              createdAt: firestoreData?.createdAt || serverTimestamp(), 
              updatedAt: serverTimestamp()
            }, { merge: true });
            console.log(`signInWithGoogle: Profile updated for user ${firebaseUser.uid} with new role ${userRole} and photoURL.`);
        }
      } else {
        await setDoc(userDocRef, {
          uid: firebaseUser.uid,
          email: userEmail,
          displayName: userDisplayName,
          photoURL: photoURL,
          role: userRole,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log("New account created in Firestore with role:", userRole);
      }
      
       setUser({
        uid: firebaseUser.uid,
        email: userEmail,
        displayName: userDisplayName,
        photoURL: photoURL,
        role: userRole,
      });
      router.push('/'); 
    } catch (error: any) {
      console.error("Error during Google sign-in:", error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setAuthError("Sign-in was cancelled. Please try again.");
      } else if (error.code === 'auth/network-request-failed') {
        setAuthError("Network error. Please check your connection and try again.");
      } else {
        setAuthError("An error occurred during sign-in. Please try again.");
      }
      console.log("sign in error details:", error);
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    if (initializationErrorMsg || !firebaseAuthService) {
      console.log("config error");
      setLoading(false);
      // Potentially set an error message here if desired
      // setAuthError("Cannot sign out due to configuration issues.");
      return;
    }
    setLoading(true);
    try {
      await firebaseSignOut(firebaseAuthService);
      // setUser(null) will be handled by onAuthStateChanged
      console.log("User signed out successfully.");
      router.push('/login'); // Changed from '/' to '/login'
    } catch (error: any) {
      console.error("Error during sign-out:", error);
      // It's good practice to provide feedback to the user.
      setAuthError("An error occurred during sign-out. Please try again.");
    } finally {
      // setLoading(false) will be handled by onAuthStateChanged when setUser(null) is called
    }
  };

  if (initializationErrorMsg) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
        <p className="text-center text-foreground">{initializationErrorMsg} ERROR </p>
      </div>
    );
  }
  
  // Show loading spinner only during the initial auth check if not initialized or no user yet.
  // Once user state is known (null or an object), or if there's an error, this condition won't be met.
  if (loading && !user && !initializationErrorMsg && firebaseAuthService?.currentUser === undefined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
        <p>Loading ...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, authError, roleMismatchError, signInWithGoogle, signOutUser, clearAuthError, clearRoleMismatchError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // loading state now more accurately reflects auth and profile fetching state
  return context;
}
