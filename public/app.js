// --- Firebase SDK Setup (User must configure this) ---
// IMPORTANT: User needs to include Firebase SDKs in index.html and initialize Firebase here
// e.g.,
// const firebaseConfig = { /* ... your firebase config ... */ };
// firebase.initializeApp(firebaseConfig);
// const auth = firebase.auth();
// const functions = firebase.functions(); // Optionally specify region: functions('europe-west1');

// For development, we'll mock these if not available, but with warnings.
let auth, functions;
if (typeof firebase !== 'undefined' && firebase.auth && firebase.functions) {
    auth = firebase.auth();
    functions = firebase.functions();
    // To use the emulator, uncomment the appropriate lines after firebase is initialized
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ) {
       console.log("Attempting to connect to Firebase Emulators...");
       try {
         auth.useEmulator("http://localhost:9099");
         functions.useEmulator("localhost", 5001); // Default port for functions emulator
         console.log("Successfully connected to Firebase Auth & Functions Emulators.");
       } catch (e) {
         console.error("Error connecting to Firebase emulators. Make sure they are running.", e);
         alert("Could not connect to Firebase emulators. Please ensure they are running. App functionality will be limited.");
       }
    }
} else {
    console.warn("Firebase SDK not found or initialized. App will run with mock Firebase services. User interaction for auth will not work.");
    // Mock Firebase for basic UI flow without actual Firebase backend
    auth = {
        onAuthStateChanged: (callback) => {
            // Simulate user being logged out initially
            setTimeout(() => callback(mockCurrentUser), 0);
            return () => {}; // Unsubscribe function
        },
        signInWithPopup: () => Promise.reject(new Error("Firebase not initialized. Sign-in disabled.")),
        signOut: () => {
            mockCurrentUser = null;
            mockAuthStateChangedCallback(null); // Notify listener
            return Promise.resolve();
        }
    };
    functions = {
        httpsCallable: (functionName) => {
            return async (data) => {
                console.warn(`Mock function call to ${functionName} with data:`, data);
                if (functionName === 'getAuthStatus_v1') {
                    return Promise.resolve({ data: { status: { calendar: false, gmail: false } } });
                }
                if (functionName === 'createCalendarEvent_v1') {
                    return Promise.resolve({ data: { eventId: 'mock-event-id', eventUrl: '#mock', meetLink: 'mock-meet-link' } });
                }
                if (functionName === 'listEmails_v1') {
                    return Promise.resolve({ data: { emails: [{id: 'mock1', subject: 'Mock Email 1', snippet: 'This is a mock email.', from: 'mock@example.com', date: new Date().toISOString()}] } });
                }
                return Promise.reject(new Error(`Mock function ${functionName} not fully implemented.`));
            };
        }
    };
    // Add a signInWithGoogle mock if it doesn't exist on the mock auth
    if (!auth.signInWithGoogle) {
        auth.signInWithGoogle = () => {
            mockCurrentUser = { email: "mock@example.com", uid: "mock-uid" };
            if(mockAuthStateChangedCallback) mockAuthStateChangedCallback(mockCurrentUser);
            return Promise.resolve({ user: mockCurrentUser });
        };
    }
}

let mockCurrentUser = null;
let mockAuthStateChangedCallback = () => {};
// Ensure onAuthStateChanged is properly mocked if we are in a mock environment
if (auth.constructor.name === 'Object' && auth.onAuthStateChanged === undefined) { // Heuristic for mock environment
    auth.onAuthStateChanged = (callback) => {
        mockAuthStateChangedCallback = callback;
        // Simulate initial state (e.g., logged out)
        setTimeout(() => callback(mockCurrentUser), 0);
        // Return an unsubscribe function
        return () => { mockAuthStateChangedCallback = () => {} };
    };
}


let currentUser = null; // Will be set by Firebase Auth
let currentUserToken = null; // To store ID token

// DOM Elements
const userInfoDiv = document.getElementById('user-info');
const userEmailSpan = document.getElementById('user-email');
const signOutButton = document.getElementById('sign-out-button');

const calendarAuthStatusSpan = document.getElementById('calendar-auth-status');
const authorizeCalendarButton = document.getElementById('authorize-calendar-button');
const gmailAuthStatusSpan = document.getElementById('gmail-auth-status');
const authorizeGmailButton = document.getElementById('authorize-gmail-button');

const calendarEventContainer = document.getElementById('calendar-event-container');
const eventSummaryInput = document.getElementById('event-summary');
const eventDescriptionInput = document.getElementById('event-description');
const eventStartInput = document.getElementById('event-start');
const eventEndInput = document.getElementById('event-end');
const eventAttendeesInput = document.getElementById('event-attendees');
const createEventButton = document.getElementById('create-event-button');
const eventCreationStatusP = document.getElementById('event-creation-status');

const gmailContainer = document.getElementById('gmail-container');
const fetchEmailsButton = document.getElementById('fetch-emails-button');
const emailFetchStatusP = document.getElementById('email-fetch-status');
const emailListUl = document.getElementById('email-list');

// --- Firebase Auth State Change Handler ---
auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (currentUser) {
        try {
            currentUserToken = await currentUser.getIdToken();
        } catch (error) {
            console.error("Error getting ID token:", error);
            currentUserToken = null; // Handle error, maybe sign out user
            auth.signOut();
            return;
        }
        userInfoDiv.style.display = 'block';
        userEmailSpan.textContent = currentUser.email;
        document.getElementById('auth-container').insertAdjacentHTML('beforebegin', '<p>To begin, sign in with your Google Account (via Firebase): <button id="google-signin-button">Sign In with Google</button></p>');
        const signInButton = document.getElementById('google-signin-button');
        if(signInButton) signInButton.style.display = 'none'; // Hide if user is already signed in

        // User is signed in, now check API authorization status
        checkAllApiAuthStatus();
    } else {
        currentUserToken = null;
        userInfoDiv.style.display = 'none';
        userEmailSpan.textContent = '';

        const existingSignInButton = document.getElementById('google-signin-button');
        if (!existingSignInButton) {
             document.getElementById('auth-container').insertAdjacentHTML('beforebegin', '<p>To begin, sign in with your Google Account (via Firebase): <button id="google-signin-button">Sign In with Google</button></p>');
        }
        const signInButton = document.getElementById('google-signin-button');
        if(signInButton) {
            signInButton.style.display = 'block';
            signInButton.onclick = signInWithGoogle; // Assign click handler
        }


        // Hide everything that requires auth and show placeholder messages
        calendarAuthStatusSpan.textContent = 'Sign in to check';
        calendarAuthStatusSpan.style.color = 'grey';
        gmailAuthStatusSpan.textContent = 'Sign in to check';
        gmailAuthStatusSpan.style.color = 'grey';
        authorizeCalendarButton.style.display = 'none';
        authorizeGmailButton.style.display = 'none';
        calendarEventContainer.style.display = 'none';
        gmailContainer.style.display = 'none';
    }
});

function signInWithGoogle() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        alert("Firebase SDK not loaded. Cannot sign in.");
        return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    // Add scopes that Firebase Auth itself might need, if any (usually not needed for just sign-in)
    // provider.addScope('profile');
    // provider.addScope('email');
    auth.signInWithPopup(provider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            // const credential = result.credential;
            // const token = credential.accessToken;
            // The signed-in user info.
            // const user = result.user;
            // console.log("Firebase sign-in success:", user);
            // onAuthStateChanged will handle the rest.
            const signInButton = document.getElementById('google-signin-button');
            if(signInButton) signInButton.style.display = 'none';
        })
        .catch((error) => {
            console.error("Firebase Google Sign-in error:", error);
            alert(`Sign-in failed: ${error.message}`);
        });
}

signOutButton.addEventListener('click', () => {
    auth.signOut().then(() => {
        // console.log("User signed out.");
        // onAuthStateChanged will handle UI updates.
    }).catch(error => {
        console.error("Sign out error:", error);
    });
});


// --- API Authorization Status ---
async function checkApiAuthStatus(serviceName, statusElement, authButton, containerElement) {
    if (!currentUser) {
        statusElement.textContent = "Sign in first";
        statusElement.style.color = 'grey';
        authButton.style.display = 'none';
        if (containerElement) containerElement.style.display = 'none';
        return false;
    }

    statusElement.textContent = "Checking...";
    statusElement.style.color = 'orange';

    try {
        const getAuthStatusFn = functions.httpsCallable('getAuthStatus_v1');
        // Pass the current user's ID token for backend authentication if your rules require it,
        // though for this specific function, context.auth.uid is used on the backend.
        const response = await getAuthStatusFn({ services: [serviceName] });
        const isAuthorized = response.data.status[serviceName];

        if (isAuthorized) {
            statusElement.textContent = "Authorized";
            statusElement.style.color = 'green';
            authButton.style.display = 'none';
            if (containerElement) containerElement.style.display = 'block';
            return true;
        } else {
            statusElement.textContent = "Not Authorized";
            statusElement.style.color = 'red';
            authButton.style.display = 'block';
            if (containerElement) containerElement.style.display = 'none';
            return false;
        }
    } catch (error) {
        console.error(`Error checking ${serviceName} auth status:`, error);
        statusElement.textContent = "Error checking status";
        statusElement.style.color = 'red';
        authButton.style.display = 'block'; // Show button to allow re-auth attempt
        if (containerElement) containerElement.style.display = 'none';
        return false;
    }
}

async function checkAllApiAuthStatus() {
    if (!currentUser) return;
    await checkApiAuthStatus('calendar', calendarAuthStatusSpan, authorizeCalendarButton, calendarEventContainer);
    await checkApiAuthStatus('gmail', gmailAuthStatusSpan, authorizeGmailButton, gmailContainer);
}

// --- Event Listeners for API Authorization Buttons ---
authorizeCalendarButton.addEventListener('click', () => {
    if (!currentUser) {
        alert("Please sign in with Firebase first.");
        return;
    }
    // IMPORTANT: Replace YOUR_GCP_PROJECT_ID and YOUR_FUNCTIONS_REGION with actual values
    // These should ideally come from a config or be known.
    // The initiateAuth function itself constructs its own redirect_uri based on its config.
    const functionRegion = "us-central1"; // Or your functions region
    const gcpProjectId = "YOUR_GCP_PROJECT_ID"; // The user needs to set this
    alert("Please replace YOUR_GCP_PROJECT_ID in app.js with your actual GCP project ID for the authorizeCalendarButton and authorizeGmailButton to work correctly if not using Firebase Hosting's default URL resolution for functions.");

    const scopes = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events";
    // For Firebase Hosting, you can use relative URLs for functions: /initiateAuth
    // For local testing with emulators or direct function URL:
    // const initiateAuthUrl = `http://localhost:5001/${gcpProjectId}/${functionRegion}/initiateAuth`;
    // When deployed:
    // Note: functions.httpsCallable('someFunction').service.url is not a public API, might not exist.
    // Constructing URL based on known patterns or using relative paths with Firebase Hosting.

    // For Firebase Hosting, you can use relative URLs for functions: /initiateAuth_v1
    // For local testing with emulators or direct function URL:
    // User must ensure their functions.config().oauth.project_id (GCP_PROJECT_ID) and functions.config().oauth.region (FUNCTIONS_REGION) are set
    // in their Firebase Function's environment configuration for the backend to build the REDIRECT_URI correctly.
    // The frontend also needs to know this to construct the initiateAuth_v1 URL if not using relative paths.

    let finalInitiateAuthUrl;
    const functionName = 'initiateAuth_v1';

    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        // IMPORTANT: User needs to replace 'YOUR_FIREBASE_PROJECT_ID_HERE' with their actual Firebase project ID for emulator URLs.
        // This should match the GCP_PROJECT_ID used by the functions for REDIRECT_URI consistency.
        const emuProjectId = functions.app?.options?.projectId || "my-firebase-project-id"; // Attempt to get project ID or use placeholder
        const emuRegion = "us-central1"; // Common default, ensure it matches function deployment region / REDIRECT_URI region
        console.warn(`Using emulator URL for ${functionName}. Project ID: ${emuProjectId}, Region: ${emuRegion}. Ensure this matches your function's environment config.`);
        if (emuProjectId === "my-firebase-project-id") {
            alert("Please update the placeholder 'my-firebase-project-id' in public/app.js with your actual Firebase Project ID for emulator testing of OAuth flow.");
        }
        finalInitiateAuthUrl = `http://localhost:5001/${emuProjectId}/${emuRegion}/${functionName}?scopes=${encodeURIComponent(scopes)}&uid=${currentUser.uid}`;
    } else {
        // Deployed environment (assuming Firebase Hosting or same origin)
        // If functions are hosted on a different domain, this needs to be the absolute URL.
        finalInitiateAuthUrl = `/${functionName}?scopes=${encodeURIComponent(scopes)}&uid=${currentUser.uid}`;
    }

    console.log(`Redirecting to: ${finalInitiateAuthUrl} for Calendar auth`);
    window.location.href = finalInitiateAuthUrl;
});

authorizeGmailButton.addEventListener('click', () => {
    if (!currentUser) {
        alert("Please sign in with Firebase first.");
        return;
    }
    const scopes = "https://www.googleapis.com/auth/gmail.readonly";
    let finalInitiateAuthUrl;
    const functionName = 'initiateAuth_v1';

    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        const emuProjectId = functions.app?.options?.projectId || "my-firebase-project-id";
        const emuRegion = "us-central1";
        console.warn(`Using emulator URL for ${functionName} (Gmail). Project ID: ${emuProjectId}, Region: ${emuRegion}.`);
        if (emuProjectId === "my-firebase-project-id") {
            alert("Please update the placeholder 'my-firebase-project-id' in public/app.js with your actual Firebase Project ID for emulator testing of OAuth flow.");
        }
        finalInitiateAuthUrl = `http://localhost:5001/${emuProjectId}/${emuRegion}/${functionName}?scopes=${encodeURIComponent(scopes)}&uid=${currentUser.uid}`;
    } else {
        finalInitiateAuthUrl = `/${functionName}?scopes=${encodeURIComponent(scopes)}&uid=${currentUser.uid}`;
    }

    console.log(`Redirecting to: ${finalInitiateAuthUrl} for Gmail auth`);
    window.location.href = finalInitiateAuthUrl;
});


// --- Calendar Event Creation ---
createEventButton.addEventListener('click', async () => {
    if (!currentUser || !currentUserToken) {
        eventCreationStatusP.textContent = "Please sign in first.";
        return;
    }
    const summary = eventSummaryInput.value;
    const description = eventDescriptionInput.value;
    const startDateTimeLocal = eventStartInput.value;
    const endDateTimeLocal = eventEndInput.value;
    const attendees = eventAttendeesInput.value.split(',').map(email => email.trim()).filter(email => email);
    const addMeet = document.getElementById('event-add-meet') ? document.getElementById('event-add-meet').checked : true; // Assume true if checkbox not there

    if (!summary || !startDateTimeLocal || !endDateTimeLocal) {
        eventCreationStatusP.textContent = "Summary, Start, and End times are required.";
        eventCreationStatusP.style.color = 'red';
        return;
    }

    // Convert local datetime to ISO 8601 format. The backend expects ISO strings.
    // The user's local timezone will be used by default by new Date(), then converted to ISO (usually UTC Z).
    // The backend function can also accept a timeZone property if specific timezone handling is needed beyond ISO.
    const startDateTimeISO = new Date(startDateTimeLocal).toISOString();
    const endDateTimeISO = new Date(endDateTimeLocal).toISOString();
    const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;


    eventCreationStatusP.textContent = "Creating event...";
    eventCreationStatusP.style.color = 'orange';
    try {
        const createEventFn = functions.httpsCallable('createCalendarEvent_v1');
        const result = await createEventFn({
            summary,
            description,
            startTime: startDateTimeISO,
            endTime: endDateTimeISO,
            timeZone: localTimeZone, // Send client's timezone; backend can use it
            attendees: attendees, // No need to map to {email: email} here, backend handles it
            addMeet: addMeet
        });

        if (result.data.eventId) {
            eventCreationStatusP.innerHTML = `Event created successfully! <br>
                ID: ${result.data.eventId} <br>
                <a href="${result.data.eventUrl}" target="_blank">View Event</a> <br>
                ${result.data.meetLink ? `Meet Link: <a href="${result.data.meetLink}" target="_blank">${result.data.meetLink}</a>` : "No Meet link generated."}`;
            eventCreationStatusP.style.color = 'green';
        } else {
            throw new Error(result.data.message || "Unknown error creating event.");
        }

    } catch (error) {
        console.error("Error creating event:", error);
        eventCreationStatusP.textContent = `Error: ${error.message || 'Failed to create event.'}`;
        eventCreationStatusP.style.color = 'red';
    }
});

// --- Fetch Gmail Messages ---
fetchEmailsButton.addEventListener('click', async () => {
    if (!currentUser || !currentUserToken) {
        emailFetchStatusP.textContent = "Please sign in first.";
        emailFetchStatusP.style.color = 'red';
        return;
    }
    emailFetchStatusP.textContent = "Fetching emails...";
    emailFetchStatusP.style.color = 'orange';
    emailListUl.innerHTML = ''; // Clear previous list

    try {
        const listEmailsFn = functions.httpsCallable('listEmails_v1');
        const result = await listEmailsFn({ maxResults: 5 }); // Example: fetch 5 emails
        const emails = result.data.emails;

        if (emails && emails.length > 0) {
            emails.forEach(email => {
                if (email.error) { // Handle per-email errors if any
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>Error fetching email ID ${email.id || ''}:</strong> ${email.error}`;
                    li.style.color = 'grey';
                    emailListUl.appendChild(li);
                    return;
                }
                const li = document.createElement('li');

                const subjectStrong = document.createElement('strong');
                subjectStrong.textContent = "Subject: ";
                const subjectSpan = document.createElement('span');
                subjectSpan.textContent = email.subject || '(No Subject)';

                const fromStrong = document.createElement('strong');
                fromStrong.textContent = "From: ";
                const fromSpan = document.createElement('span');
                fromSpan.textContent = email.from || '(Unknown Sender)';

                const dateStrong = document.createElement('strong');
                dateStrong.textContent = "Date: ";
                const dateSpan = document.createElement('span');
                dateSpan.textContent = email.date ? new Date(email.date).toLocaleString() : '(No Date)';

                const snippetEm = document.createElement('em');
                snippetEm.textContent = `Snippet: ${email.snippet || '(No snippet)'}`;

                li.appendChild(subjectStrong);
                li.appendChild(subjectSpan);
                li.appendChild(document.createElement('br'));
                li.appendChild(fromStrong);
                li.appendChild(fromSpan);
                li.appendChild(document.createElement('br'));
                li.appendChild(dateStrong);
                li.appendChild(dateSpan);
                li.appendChild(document.createElement('br'));
                li.appendChild(snippetEm);

                emailListUl.appendChild(li);
            });
            emailFetchStatusP.textContent = "Emails fetched successfully.";
            emailFetchStatusP.style.color = 'green';
        } else {
            emailFetchStatusP.textContent = "No emails found or you may need to authorize Gmail access.";
            emailFetchStatusP.style.color = 'grey';
        }
    } catch (error) {
        console.error("Error fetching emails:", error);
        emailFetchStatusP.textContent = `Error: ${error.message || 'Failed to fetch emails.'}`;
        emailFetchStatusP.style.color = 'red';
    }
});


// --- Handle OAuth Redirect (if any params in URL) ---
// This is a simplified version. The `oauthCallback` Firebase Function would handle the token exchange.
// The frontend might receive a status message or just be redirected to a clean URL.
window.addEventListener('load', () => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get('oauth_status');
    const service = params.get('service'); // 'calendar' or 'gmail'
    const returnedUid = params.get('uid_placeholder'); // UID placeholder from callback

    if (oauthStatus === 'success' && service) {
        alert(`${service.charAt(0).toUpperCase() + service.slice(1)} authorization successful!`);
        // If the current user is the one who authorized, refresh their status
        if (currentUser && currentUser.uid === returnedUid) {
            if (service === 'calendar') {
                checkApiAuthStatus('calendar', calendarAuthStatusSpan, authorizeCalendarButton, calendarEventContainer);
            } else if (service === 'gmail') {
                checkApiAuthStatus('gmail', gmailAuthStatusSpan, authorizeGmailButton, gmailContainer);
            }
        } else if (!currentUser && returnedUid) {
            // User might not be signed in on this page yet, or different user.
            // We can't do much here other than note it. The user will need to sign in,
            // and then onAuthStateChanged will trigger checkAllApiAuthStatus.
            console.log(`OAuth successful for UID ${returnedUid} for service ${service}, but current user is not signed in or is different. Status will update upon correct user sign-in.`);
        }
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (oauthStatus === 'error') {
        const errorMessage = params.get('error_message') || 'Unknown error during authorization.';
        alert(`Authorization failed for ${service || 'service'}: ${errorMessage}`);
        console.error(`OAuth Error for ${service}: ${errorMessage}`);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Initial check when page loads (onAuthStateChanged will also run)
    // No need to call simulateUserSignIn or anything like that here anymore,
    // Firebase's onAuthStateChanged is the source of truth for user state.
});


// --- Initial Load & Global Event Listeners ---
// Add the sign-in button dynamically if user is not logged in.
// onAuthStateChanged handles the initial auth status check.

// Placeholder for where user adds their Firebase config and initialization
console.log("app.js loaded. Ensure Firebase SDKs are included and initialized before this script.");
console.log("User should replace 'YOUR_GCP_PROJECT_ID' and potentially function URLs if not using Firebase Hosting defaults or emulators.");

// Add a global sign-in button if no user is detected initially by onAuthStateChanged
// This is a bit redundant as onAuthStateChanged handles it, but can act as a fallback visual.
if (!currentUser) {
    const authContainer = document.getElementById('auth-container');
    const existingSignInButton = document.getElementById('google-signin-button');
    if (authContainer && !existingSignInButton) {
        // This button will be shown/hidden by onAuthStateChanged logic
    }
}
