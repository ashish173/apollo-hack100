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

const requiredEnvVars: Record<string, string | undefined> = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET, // <--- Add this to required
};

const missingConfigKeys: string[] = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingConfigKeys.length > 0) {
  const errorMessage = `Firebase configuration is incomplete. Missing environment variable(s): ${missingConfigKeys.join(
    ", "
  )}. Please set them in your .env.local file and restart the server.`;
  console.error(`CRITICAL: ${errorMessage}`);
  firebaseInitializationError = new Error(errorMessage);
} else {
  const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
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