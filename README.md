# Google Services Integration with Firebase

## Project Overview

This project demonstrates how to integrate Google Calendar (event creation with Google Meet links) and Google Gmail (reading email messages) into a web application using Firebase. It features Firebase Authentication for user sign-in, Firebase Functions for backend logic and secure Google API calls, and Firestore for storing user-specific OAuth refresh tokens. The frontend is built with plain HTML, CSS, and JavaScript.

The Google API integration code has been merged into an existing Firebase Functions setup that also includes AI-related functionalities using the Anthropic Claude API.

## Features

*   **User Authentication**: Google Sign-in via Firebase Authentication.
*   **Google API Authorization**:
    *   OAuth 2.0 flow to obtain user consent for accessing Google Calendar and Gmail.
    *   Secure storage of refresh tokens in Firestore, associated with user UIDs.
    *   Frontend UI to display authorization status for each service.
*   **Google Calendar Integration**:
    *   Create calendar events in the user's primary calendar.
    *   Optionally add a Google Meet link to the created event.
*   **Google Gmail Integration**:
    *   List recent email messages from the user's Gmail account (displays subject, sender, date, snippet).
*   **Firebase Functions**: Backend logic for handling OAuth flow and making Google API calls securely.
*   **Firestore**: Securely stores user refresh tokens.
*   **Frontend**: A simple web page (`public/index.html`) to interact with the services.

## File Structure

```
.
├── functions/                # Firebase Functions (Backend)
│   ├── src/
│   │   ├── ai/               # Existing AI-related flows
│   │   └── index.ts          # Main backend code (Google API + AI functions)
│   ├── package.json
│   └── ...                   # Other function config files (tsconfig.json, .eslintrc.js)
├── public/                   # Frontend files (Firebase Hosting)
│   ├── index.html            # Main HTML page
│   ├── app.js                # Frontend JavaScript logic
│   └── style.css             # Basic styling
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
*   Install dependencies: `npm install`
*   **Set Firebase Environment Configuration**: Replace placeholders with your actual credentials and project details.
    ```bash
    firebase functions:config:set oauth.client_id="YOUR_GOOGLE_OAUTH_CLIENT_ID_FROM_STEP_2"
    firebase functions:config:set oauth.client_secret="YOUR_GOOGLE_OAUTH_CLIENT_SECRET_FROM_STEP_2"
    firebase functions:config:set oauth.project_id="YOUR_GCP_PROJECT_ID"
    firebase functions:config:set oauth.region="YOUR_FUNCTIONS_REGION" # e.g., us-central1
    ```
    (Note: The existing AI functions might require `ANTHROPIC_API_KEY` to be set as well for them to work: `firebase functions:config:set anthropic.api_key="YOUR_ANTHROPIC_KEY"`)
*   **(TypeScript)** Build the functions: `npm run build`. This compiles `src/index.ts` to `lib/index.js` (as per `package.json`).

**5. Frontend Setup (`public` directory)**
*   **Firebase SDK Snippet**: Open `public/index.html`. Before the `<script src="app.js"></script>` line, you need to add your Firebase project's SDK configuration snippet. You can get this from your Firebase project settings in the console ("Your apps" -> "Web app" -> "SDK setup and configuration" -> "Config"). It looks like this:
    ```html
    <!-- TODO: Add your Firebase project's SDK configuration snippet here -->
    <!--
    <script src="/__/firebase/9.x.x/firebase-app-compat.js"></script>
    <script src="/__/firebase/9.x.x/firebase-auth-compat.js"></script>
    <script src="/__/firebase/9.x.x/firebase-functions-compat.js"></script>
    <script src="/__/firebase/init.js"></script>
    -->
    <!-- Example Firebase SDK setup: -->
    <script>
      // IMPORTANT: Replace with your web app's Firebase configuration
      // const firebaseConfig = {
      //   apiKey: "AIza...",
      //   authDomain: "your-project-id.firebaseapp.com",
      //   projectId: "your-project-id",
      //   storageBucket: "your-project-id.appspot.com",
      //   messagingSenderId: "...",
      //   appId: "1:...",
      //   measurementId: "G-..." // Optional, for Google Analytics
      // };
      // // Initialize Firebase
      // if (typeof firebase !== 'undefined') {
      //    firebase.initializeApp(firebaseConfig);
      // }
    </script>
    ```
    Make sure to uncomment and fill in your actual `firebaseConfig` object. The `/__/firebase/init.js` script is typically used when deploying to Firebase Hosting, which automatically serves the correct config. For local development without emulating hosting's auto-config, you'll need to provide the config object manually.
*   **Emulator Project ID (for local testing)**: If you plan to use Firebase Emulators for local testing, open `public/app.js`. Locate the following lines (around line 260 and 290 in the modified file):
    `const emuProjectId = functions.app?.options?.projectId || "my-firebase-project-id";`
    If `functions.app?.options?.projectId` doesn't automatically resolve to your actual project ID when using emulators (it might if `firebase.initializeApp` is called before this line with the correct config), you **must** replace `"my-firebase-project-id"` with your actual Firebase Project ID. This is critical for the OAuth `initiateAuth_v1` redirect URLs to work correctly with the emulators.

## Deployment

1.  **Deploy Firestore Rules**:
    `firebase deploy --only firestore:rules`
2.  **Deploy Firebase Functions**:
    First, ensure your functions are built: `(cd functions && npm run build && cd ..)`
    Then deploy: `firebase deploy --only functions`
3.  **Deploy Hosting (Frontend Files)**:
    `firebase deploy --only hosting`

After deployment, your application should be live at your Firebase Hosting URL (e.g., `https://<YOUR_FIREBASE_PROJECT_ID>.web.app`).

## Running Locally (with Firebase Emulators)

This is highly recommended for development.
1.  Ensure you have the Java JDK installed (required by Firestore and other emulators).
2.  **Configure `firebase.json` (Recommended)**:
    Your `firebase.json` should define which emulators to use and their ports. Example:
    ```json
    {
      "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" },
      "functions": { "source": "functions", "runtime": "nodejs20" },
      "hosting": {
        "public": "public",
        "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
        "rewrites": [ { "source": "/initiateAuth_v1", "function": "initiateAuth_v1" }, { "source": "/oauthCallback_v1", "function": "oauthCallback_v1" } ]
      },
      "emulators": {
        "auth": { "port": 9099 },
        "functions": { "port": 5001, "runtime": "nodejs20" },
        "firestore": { "port": 8080 },
        "hosting": { "port": 5000 },
        "ui": { "enabled": true, "port": 4000 }
      }
    }
    ```
    *Note the `rewrites` in hosting: this allows relative URLs like `/initiateAuth_v1` from the frontend to correctly route to your functions when using `firebase serve` or `firebase emulators:start`.*
3.  **Start Emulators**:
    `firebase emulators:start --only auth,functions,firestore,hosting`
    (Or simply `firebase emulators:start` if `firebase.json` is fully configured).
4.  Open your browser to `http://localhost:5000` (or the port specified for the hosting emulator). The Emulator UI will be at `http://localhost:4000`.
5.  The `public/app.js` script attempts to connect to emulators if it detects `localhost`. Remember to check the Project ID for emulator URLs as mentioned in "Frontend Setup".

## Important Notes

*   **`@ts-nocheck`**: The `functions/src/index.ts` file includes a `@ts-nocheck` directive. This was part of the original codebase. For robust long-term maintenance and to fully leverage TypeScript's benefits, type errors within this file should be addressed, and this directive ideally removed.
*   **Function Naming Suffix (`_v1`)**: All Google API related Firebase Functions and their client-side calls use a `_v1` suffix. This ensures they are uniquely named and clearly distinguished, especially important in the mixed JS/TS and v1/v2 Cloud Functions environment of the original `functions/src/index.ts`.
*   **Security**:
    *   Always keep your OAuth Client Secret and any API keys confidential. Use Firebase environment configuration as shown.
    *   The provided `firestore.rules` are a starting point. Review and adapt them to your application's specific security needs.
*   **Error Handling**: The application includes basic error handling. For production, consider more comprehensive logging and user feedback.
*   **Scopes**: The application requests specific OAuth scopes. If you need more permissions, update the `scopes` parameter when calling `initiateAuth_v1` and ensure users re-authorize.

This guide should help you get the project set up and running. Remember to replace all placeholder values with your actual project IDs and credentials.
