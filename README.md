# Google Services Integration with Firebase

## Project Overview

This project integrates Google Calendar (event creation with Google Meet links) and Google Gmail (reading email messages) into a web application, primarily focusing on a Next.js frontend for a "Teacher" role, while also retaining Firebase Functions for backend logic. It uses Firebase Authentication (Google provider) for user sign-in and Firestore for storing OAuth refresh tokens.

The Google API integration code within Firebase Functions is merged into an existing setup that also includes AI-related functionalities using the Anthropic Claude API.

## Features

*   **User Authentication**: Google Sign-in via Firebase Authentication for the Next.js teacher portal.
*   **Google API Authorization (Next.js Teacher Portal)**:
    *   Dedicated page (`/teacher/schedule`) for managing Google service authorizations.
    *   OAuth 2.0 flow to obtain user consent for Google Calendar and Gmail.
    *   Secure storage of refresh tokens in Firestore.
    *   UI to display authorization status and buttons to "Authorize" or "Revoke Access".
    *   Token revocation capability.
*   **Google Calendar & Gmail Integration (via Firebase Functions)**:
    *   Firebase Functions (`createCalendarEvent_v1`, `listEmails_v1`) enable creating calendar events (with Meet links) and listing Gmail messages. These can be called from the Next.js app once authorized.
*   **Firebase Functions**: Handles OAuth flow, Google API calls, and token revocation securely.
*   **Firestore**: Securely stores user refresh tokens.
*   **Next.js Frontend**: Teacher-specific UI at `/teacher/schedule` for managing integrations.
*   **Standalone Demo (Optional)**: Original plain HTML/JS demo in `public/` for broader testing of the core Firebase Functions.

## File Structure

```
.
├── src/                      # Next.js App Structure
│   ├── app/
│   │   ├── teacher/
│   │   │   ├── schedule/
│   │   │   │   └── page.tsx  # Google Auth Management page for Teachers
│   │   │   └── dashboard/
│   │   │       └── layout.tsx # Teacher dashboard layout (sidebar modified)
│   │   └── ...               # Other Next.js app routes and components
│   ├── components/
│   │   └── ui/
│   │       └── sidebar.tsx   # Sidebar component (modified)
│   ├── context/
│   │   └── auth-context.tsx  # Assumed Firebase Auth context
│   └── lib/
│       └── firebase.ts       # Assumed Firebase initialization file
├── functions/                # Firebase Functions (Backend)
│   ├── src/
│   │   ├── ai/               # Existing AI-related flows
│   │   └── index.ts          # Main backend code (Google API + AI functions)
│   ├── package.json
│   └── ...
├── public/                   # Standalone demo files (optional to keep)
│   ├── index.html
│   ├── app.js
│   └── style.css
├── firestore.rules           # Security rules for Firestore
├── firebase.json             # Firebase project configuration
└── README.md                 # This file
```

## Setup Instructions

Follow these steps to get the project running:

**1. Firebase Project Setup**
*   Create a new Firebase project in the [Firebase Console](https://console.firebase.google.com/) or use an existing one.
*   **Enable Firestore**: Go to "Firestore Database" and create a database (e.g., in production or test mode).
*   **Enable Authentication**: Go to "Authentication" -> "Sign-in method" and enable "Google" as a sign-in provider. Provide a project support email.

**2. Google Cloud Console Configuration**
*   Your Firebase project is linked to a Google Cloud Platform (GCP) project. Open it in the [GCP Console](https://console.cloud.google.com/).
*   **Enable APIs**:
    *   Go to "APIs & Services" -> "Library".
    *   Search for and enable:
        *   **Google Calendar API**
        *   **Gmail API**
*   **OAuth 2.0 Credentials**:
    *   Go to "APIs & Services" -> "Credentials".
    *   Click "+ CREATE CREDENTIALS" -> "OAuth client ID".
    *   Select "Web application" for the application type.
    *   Give it a name (e.g., "Firebase Google Services Web Client").
    *   Under "Authorized redirect URIs", click "+ ADD URI" and add the following:
        `https://<YOUR_FUNCTIONS_REGION>-<YOUR_GCP_PROJECT_ID>.cloudfunctions.net/oauthCallback_v1`
        *   Replace `<YOUR_FUNCTIONS_REGION>` with the region where your Firebase Functions will be deployed (e.g., `us-central1`).
        *   Replace `<YOUR_GCP_PROJECT_ID>` with your Firebase (and GCP) Project ID.
    *   Click "CREATE". Note down the **Client ID** and **Client Secret**. You'll need these later.

**3. Local Project Files**
*   Clone this repository or download the files to your local machine.
*   Install the Firebase CLI if you haven't already: `npm install -g firebase-tools`
*   Log in to Firebase: `firebase login`
*   Associate your local project with your Firebase project: `firebase use --add <YOUR_FIREBASE_PROJECT_ID>` (select your project from the list).

**4. Backend Setup (`functions` directory)**
*   Navigate to the `functions` directory: `cd functions`
*   Install dependencies: `npm install` (this will install `googleapis`, `axios`, etc.).
*   **Set Firebase Function Parameters (for v2 Functions)**:
    The Google API functions now use Cloud Functions v2 parameterized configuration. You'll need to set these parameters. You can do this by:
    1.  **Using `.env` files (Recommended for local development & ease of use)**:
        Create a file named `functions/.env.local` (or `functions/.env.<YOUR_PROJECT_ID>`). Add the following lines, replacing placeholder values:
        ```env
        OAUTH_CLIENT_ID="YOUR_GOOGLE_OAUTH_CLIENT_ID_FROM_STEP_2"
        GCP_PROJECT_ID="YOUR_GCP_PROJECT_ID"
        FUNCTIONS_REGION="YOUR_FUNCTIONS_REGION" # e.g., us-central1
        # For ANTHROPIC_API_KEY (if used by other functions)
        ANTHROPIC_API_KEY="YOUR_ANTHROPIC_KEY"
        ```
        For `OAUTH_CLIENT_SECRET`, because it's a secret, you should use Secret Manager:
        *   Go to Google Cloud Secret Manager, create a secret (e.g., `google-oauth-client-secret`) and add the client secret value as a version.
        *   Grant the "Secret Manager Secret Accessor" role to your Cloud Functions service account (usually `PROJECT_ID@appspot.gserviceaccount.com`).
        *   In `functions/.env.local` (or similar), reference it:
            `OAUTH_CLIENT_SECRET="projects/YOUR_GCP_PROJECT_ID/secrets/google-oauth-client-secret/versions/latest"`
            (Replace `YOUR_GCP_PROJECT_ID` and `google-oauth-client-secret` with your actual IDs).
    2.  **Using `firebase functions:params:set` (CLI for deployment)**:
        For non-secret parameters, you can use:
        ```bash
        firebase functions:params:set OAUTH_CLIENT_ID="YOUR_CLIENT_ID"
        firebase functions:params:set GCP_PROJECT_ID="YOUR_GCP_PROJECT_ID"
        firebase functions:params:set FUNCTIONS_REGION="us-central1"
        ```
        For secrets managed by Secret Manager and defined with `defineSecret` in your code (like `OAUTH_CLIENT_SECRET_PARAM`), Firebase CLI typically prompts you during deployment (`firebase deploy --only functions`) to link them to a Secret Manager secret, or you can pre-configure this linkage.
    *   The `ANTHROPIC_API_KEY_PARAM` for existing AI functions would also be set similarly (e.g., in `.env.local` or via CLI).
*   **(TypeScript)** Build the functions: `npm run build`. This compiles `functions/src/index.ts` to `functions/lib/index.js`.

**5. Next.js Frontend Setup (`src` directory)**
*   **Firebase SDK Initialization**: Ensure Firebase is initialized in your Next.js app. This is typically done in a central file (e.g., `src/lib/firebase.ts` or similar, imported by your `AuthContext` or root layout). Use environment variables (e.g., `NEXT_PUBLIC_FIREBASE_PROJECT_ID`) for your Firebase config.
    Example (`src/lib/firebase.ts` - adapt to your project):
    ```typescript
    import { initializeApp, getApps, getApp } from 'firebase/app';
    // Import other Firebase services as needed (auth, firestore, functions)

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      // ... other config from your Firebase console
    };

    const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    // export const auth = getAuth(app);
    // export const functions = getFunctions(app); // etc.
    export default app; // Or export individual services
    ```
*   **Auth Context**: The `/teacher/schedule` page uses `useAuth` from ` '@/context/auth-context' `. Ensure this context correctly provides the Firebase user object.
*   **Emulator Project ID (for local testing of `/teacher/schedule`)**:
    The `src/app/teacher/schedule/page.tsx` component attempts to construct URLs for the `initiateAuth_v1` function. When using Firebase Emulators locally, it needs your Firebase Project ID. It tries to get this from `firebaseApp.options.projectId`. If this is not available or incorrect in your local dev setup, calls to authorize services via the emulator will fail. Ensure your client-side Firebase app initialization is complete and correct.

**6. Standalone Demo (`public` directory - Optional)**
*   The files in `public/` (`index.html`, `app.js`) provide a basic, standalone demo of the Google service functions.
*   If you keep this demo, follow its original setup instructions for Firebase SDK snippet and emulator Project ID in `public/app.js`.
*   This demo is separate from the Next.js teacher portal integration. You can remove these files if the Next.js integration is your sole focus.

## Deployment

1.  **Deploy Firestore Rules**:
    `firebase deploy --only firestore:rules`
2.  **Deploy Firebase Functions**:
    Ensure functions are built: `(cd functions && npm run build && cd ..)`
    Deploy: `firebase deploy --only functions`
3.  **Deploy Next.js Application**:
    *   If using Firebase Hosting for your Next.js app: Build your Next.js app (`npm run build` in your Next.js project root). Then configure `firebase.json` for Next.js hosting (often involves rewrites to a Cloud Function or Cloud Run serving your Next.js app, or using modern Firebase Hosting's direct Next.js support). Then `firebase deploy --only hosting`.
    *   If hosting Next.js elsewhere (e.g., Vercel, Netlify): Follow their deployment guides. Your Firebase Functions will still be accessible at their cloud URLs.
4.  **Deploy Standalone Demo (if kept)**:
    `firebase deploy --only hosting` (if `public` is your hosting root and Next.js isn't using it).

## Running Locally

**A. Firebase Emulators (for Functions, Firestore, Auth)**
1.  Ensure Java JDK is installed.
2.  Configure `firebase.json` for emulators (see example below). Pay attention to function runtime if specified.
3.  Start emulators: `firebase emulators:start --only auth,functions,firestore` (add `hosting` if using it for the standalone demo or Next.js).
    Emulator UI: `http://localhost:4000`

**B. Next.js Development Server**
1.  Navigate to your Next.js project root.
2.  Run `npm run dev`. This usually starts on `http://localhost:3000`.
3.  The `/teacher/schedule` page in your Next.js app will attempt to connect to the Firebase Functions emulator (if running) for calls like `getAuthStatus_v1` and `revokeGoogleAccess_v1`. The `initiateAuth_v1` redirect will also target the emulator URL.

**Example `firebase.json` for Emulators & Hosting (Standalone Demo)**:
    ```json
    {
      "firestore": { "rules": "firestore.rules" },
      "functions": [ /* Or single object if not using codebases */
        { "source": "functions", "codebase": "default", "runtime": "nodejs20" } // Or your node version
      ],
      "hosting": { // For standalone demo or if Next.js is also hosted via Firebase
        "public": "public", // Or your Next.js build output folder (e.g., 'out')
        "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
        "rewrites": [
          // For standalone demo using relative paths for functions
          { "source": "/initiateAuth_v1", "function": "initiateAuth_v1" },
          { "source": "/oauthCallback_v1", "function": "oauthCallback_v1" },
          // If hosting Next.js app, add rewrites for it here if needed
          { "source": "**", "destination": "/index.html" } // If public is SPA
        ]
      },
      "emulators": {
        "auth": { "port": 9099 },
        "functions": { "port": 5001 },
        "firestore": { "port": 8080 },
        "hosting": { "port": 5000 },
        "ui": { "enabled": true, "port": 4000 }
      }
    }
    ```
    *Adjust `hosting.public` and `rewrites` based on whether you're serving the standalone demo or your Next.js app via Firebase Hosting.*

## Important Notes

*   **Next.js Integration**: The primary focus of recent changes is the `/teacher/schedule` page within the Next.js application.
*   **Cloud Functions v2**: All Google API related Firebase Functions (`initiateAuth_v1`, `oauthCallback_v1`, `getAuthStatus_v1`, `createCalendarEvent_v1`, `listEmails_v1`, `revokeGoogleAccess_v1`) have been updated to Cloud Functions v2.
*   **Parameterized Configuration**: OAuth credentials and other function settings are now managed using v2 parameterized configuration (`defineString`, `defineSecret`) instead of v1 `functions.config()`. See "Backend Setup" for how to set these parameters using `.env` files or CLI.
*   **`@ts-nocheck`**: Present in `functions/src/index.ts`. Ideally, resolve TypeScript errors and remove this.
*   **Function Naming (`_v1`)**: Google API related Firebase Functions use a `_v1` suffix for clarity and to avoid conflicts.
*   **Revocation**: The `revokeGoogleAccess_v1` function is now available. It revokes the entire refresh token with Google.
*   **Security**: Keep OAuth credentials and API keys secret (use v2 parameters with Secret Manager for secrets). Review Firestore rules.
*   **Error Handling & Scopes**: Basic error handling is in place. Review and extend as needed.

This guide should help you set up and run the project with its Next.js integration. Remember to replace all placeholder values.
