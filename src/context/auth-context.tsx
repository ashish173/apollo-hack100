
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
  signInWithGoogle: (role: UserRole) => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationErrorMsg, setInitializationErrorMsg] = useState<string | null>(null);
  const router = useRouter();

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
              role: roleFromDb,
            });
            setLoading(false);
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
    if (initializationErrorMsg || !firebaseAuthService || !firebaseDbService) {
      console.log("failed");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuthService, googleAuthProvider);
      const firebaseUser = result.user;
      
      const userDocRef = doc(firebaseDbService, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let userRole = selectedRole;
      let userEmail = firebaseUser.email;
      let userDisplayName = firebaseUser.displayName;

      if (userDocSnap.exists()) {
        const firestoreData = userDocSnap.data();
        const roleFromDb = firestoreData?.role as UserRole | undefined;
        
        userEmail = firebaseUser.email || firestoreData?.email; // Prefer fresh auth email, fallback to DB
        userDisplayName = firebaseUser.displayName || firestoreData?.displayName; // Prefer fresh auth name, fallback to DB

        if (roleFromDb && (roleFromDb === 'teacher' || roleFromDb === 'student')) {
            userRole = roleFromDb;
            if (userRole !== selectedRole) {
                console.log("role mismatch");
                
            } else {
                console.log(`login successful ${userRole}`);
            }
             // Ensure Firestore has the latest display name and email
            if (firestoreData?.email !== userEmail || firestoreData?.displayName !== userDisplayName) {
              await setDoc(userDocRef, { 
                email: userEmail, 
                displayName: userDisplayName 
              }, { merge: true });
            }
        } else {
            console.warn(`User ${firebaseUser.uid} document exists but role is missing/invalid: "${roleFromDb}". Using selected role: ${selectedRole} and updating Firestore.`);
            userRole = selectedRole;
            await setDoc(userDocRef, {
              uid: firebaseUser.uid, // ensure uid is there
              email: userEmail,
              displayName: userDisplayName,
              role: userRole,
              createdAt: firestoreData?.createdAt || serverTimestamp(), // Preserve original createdAt or set new
              updatedAt: serverTimestamp()
            }, { merge: true });
            console.log(`prfile update`);
        }
      } else {
        await setDoc(userDocRef, {
          uid: firebaseUser.uid,
          email: userEmail,
          displayName: userDisplayName,
          role: userRole, // which is selectedRole here
          createdAt: serverTimestamp(),
        });
        console.log("Account create");
      }
      
       setUser({
        uid: firebaseUser.uid,
        email: userEmail,
        displayName: userDisplayName,
        role: userRole,
      });
      router.push('/'); 
    } catch (error: any) {
      console.error("Error during Google sign-in:", error);
      console.log("sign in error");
    } finally {
      setLoading(false);
    }
  };

  const signOutUser = async () => {
    if (initializationErrorMsg || !firebaseAuthService) {
      console.log("config error");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await firebaseSignOut(firebaseAuthService);
      // setUser(null) will be handled by onAuthStateChanged
      console.log("sign out");
      router.push('/login'); 
    } catch (error: any) {
      console.error("Error during sign-out:", error);
      console.log("sign out error");
    } finally {
      // setLoading(false) will be handled by onAuthStateChanged
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
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOutUser }}>
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
