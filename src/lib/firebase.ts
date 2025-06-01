import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage, type FirebaseStorage } from "firebase/storage"; // <--- Add this import

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined; // <--- Add this declaration
let firebaseInitializationError: Error | null = null;


  const firebaseConfig = {
    apiKey: "AIzaSyCi43QYYbRvJ3tyTwSJdX9pfz2tP5e-E0s",
    authDomain: "role-auth-7bc43.firebaseapp.com",
    projectId: "role-auth-7bc43",
    storageBucket: "role-auth-7bc43.firebasestorage.app",
    messagingSenderId: "486228852542",
    appId: "1:486228852542:web:137666fc3411de4f5f366f",
    measurementId: "G-XP2Q64FLR5"
  };

  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app); // <--- Initialize Storage here
  } catch (e: any) {
    console.error("Firebase SDK initialization failed:", e);
    firebaseInitializationError = e;
    auth = undefined;
    db = undefined;
    storage = undefined; // <--- Set storage to undefined on error
  }

const googleAuthProvider = new GoogleAuthProvider(); // This can be initialized regardless
const functions = getFunctions(app);

export {
  app,
  auth,
  db,
  storage, // <--- Export storage
  googleAuthProvider,
  firebaseInitializationError,
  functions,
};