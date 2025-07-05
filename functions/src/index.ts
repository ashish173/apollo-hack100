// @ts-nocheck
// Existing AI related imports
import { generateProjectIdeas } from "./ai/flows/generate-project-ideas";
import { logger } from "firebase-functions/v2";
import { generateProjectPlan } from "./ai/flows/generate-project-plan";
import { suggestTaskHints } from "./ai/flows/suggest-task-hints";
import { generateCurriculumSuggestions } from "./ai/flows/generate-curriculum-suggestions";

// v2 Function Imports
import { HttpsError as V2HttpsError } from "firebase-functions/v2/https";
import { onCall as v2OnCall } from "firebase-functions/v2/https";
import { onRequest as v2OnRequest } from "firebase-functions/v2/https"; // Consolidated onRequest
import { defineString as v2DefineString, defineSecret as v2DefineSecret } from "firebase-functions/params";


// --- New Imports for Google API Integration ---
import * as admin from "firebase-admin";
// import * as functions from "firebase-functions"; // REMOVED v1 functions
import { google } from "googleapis"; // Auth was not a separate import needed from googleapis
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

// --- Initialize Firebase Admin SDK (if not already initialized) ---
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// --- Configuration for existing AI functions ---
// Assuming anthropicApiKey was intended to be a secret or a param
const ANTHROPIC_API_KEY_PARAM = v2DefineString("ANTHROPIC_API_KEY"); // Or v2DefineSecret if it's a secret

// --- Configuration for Google OAuth using v2 Parameters ---
// These parameters should be set by the user, e.g., via `firebase functions:params:set ...` or in .env files
// For secrets like client_secret, it's better to use defineSecret if available and configured with Secret Manager.
const OAUTH_CLIENT_ID_PARAM = v2DefineString("OAUTH_CLIENT_ID");
const OAUTH_CLIENT_SECRET_PARAM = v2DefineSecret("OAUTH_CLIENT_SECRET"); // Using defineSecret for the client secret
const GCP_PROJECT_ID_PARAM = v2DefineString("GCP_PROJECT_ID");
const FUNCTIONS_REGION_PARAM = v2DefineString("FUNCTIONS_REGION", { default: "us-central1" }); // Corrected Pdefault to default


// Note: The direct instantiation of baseOAuth2Client and REDIRECT_URI at the global scope
// using .value() from these params can be problematic if these params are not set,
// as .value() can throw if called outside a function context or if the param isn't set.
// It's safer to construct these inside the functions or use a getter function.
// For now, we will retrieve them inside each function.

// --- Helper Function to Get Authenticated Google API Client (modified for v2 params) ---
// This helper is used by onCall functions. For onRequest, OAuth2Client is created directly.
/**
 * Creates and returns an OAuth2Client authenticated with the user's stored refresh token.
 * Refreshes the access token if necessary.
 * @param {string} uid Firebase User ID.
 * @param {string[]} requiredScopes Scopes needed for the intended API call.
 * @return {Promise<OAuth2Client>} Authenticated OAuth2Client.
 * @throws {V2HttpsError} If user is not authorized or token refresh fails.
 */
async function getUserGoogleClient(uid: string, requiredScopes: string[]): Promise<OAuth2Client> { // Used by onCall functions
  const userTokensRef = db.collection("user_tokens").doc(uid);
  const doc = await userTokensRef.get();

  if (!doc.exists) {
    logger.error(`No tokens found for user ${uid}. Re-authorization needed.`);
    throw new V2HttpsError("permission-denied", "User credentials not found. Please authorize the application for the required Google services.");
  }

  const tokens = doc.data();
  if (!tokens?.refresh_token) {
    logger.error(`No refresh token for user ${uid}. Re-authorization needed.`);
    await userTokensRef.delete(); // Clean up invalid token entry
    throw new V2HttpsError("permission-denied", "User refresh token not found. Please re-authorize the application.");
  }

  // Retrieve param values safely
  const clientId = OAUTH_CLIENT_ID_PARAM.value();
  const clientSecret = OAUTH_CLIENT_SECRET_PARAM.value(); // .value() for secrets works inside functions

  if (!clientId || !clientSecret) {
      logger.error("OAuth Client ID or Secret is not configured properly in function parameters.");
      throw new V2HttpsError("failed-precondition", "Server OAuth configuration is incomplete.");
  }

  const client = new google.auth.OAuth2(clientId, clientSecret);
  client.setCredentials({ refresh_token: tokens.refresh_token });

  // Optional: Check if stored scopes cover requiredScopes.
  // For simplicity, we assume initial authorization granted sufficient scope.
  // A more robust implementation would store granted scopes and verify.

  // Refresh the access token if it's about to expire or already expired.
  // googleapis library might do this transparently, but explicit check is safer.
  const tokenInfo = await client.getTokenInfo(client.credentials.access_token || "").catch(() => null);
  if (!tokenInfo || (tokenInfo.expiry_date && tokenInfo.expiry_date < (Date.now() + 60000))) { // Expires in next min or invalid
    logger.info(`Access token for UID ${uid} is expiring or requires refresh.`);
    try {
      const { credentials } = await client.refreshAccessToken();
      client.setCredentials(credentials); // Update client with new tokens
      logger.info(`Token refreshed for user ${uid}.`);
    } catch (error: any) {
      logger.error(`Failed to refresh token for user ${uid}:`, error);
      await userTokensRef.delete();
      throw new V2HttpsError("permission-denied", `Failed to refresh access token: ${error.message}. Please re-authorize the application.`);
    }
  }
  return client;
}

// --- Google API Integration Functions (v2) ---

// Renaming existing AI function exports to avoid conflict if they use 'onRequest' from require
// This assumes your existing AI functions are defined elsewhere or you'll adapt them.
// For now, I'm focusing on converting the Google API functions.
// If claudeChat, generateProjectIdeasFn etc. are in this file, they need to use v2OnRequest too.
// Example: exports.claudeChat = v2OnRequest({ cors: true }, async (req, res) => { ... });

export const initiateAuth_v1 = v2OnRequest(
  {
    region: FUNCTIONS_REGION_PARAM, // Pass param object directly
    secrets: [OAUTH_CLIENT_SECRET_PARAM]
  },
  async (req, res) => {
    const clientId = OAUTH_CLIENT_ID_PARAM.value();
    const clientSecret = OAUTH_CLIENT_SECRET_PARAM.value();
    const gcpProjectId = GCP_PROJECT_ID_PARAM.value();
    const functionsRegion = FUNCTIONS_REGION_PARAM.value();

    if (!clientId || !clientSecret || !gcpProjectId || !functionsRegion) {
        logger.error("OAuth parameters not fully configured.");
        res.status(500).send("OAuth client configuration error on server.");
        return;
    }

    const redirectUri = `https://${functionsRegion}-${gcpProjectId}.cloudfunctions.net/oauthCallback_v1`;
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const scopesQuery = req.query.scopes as string;
    const uid = req.query.uid as string;

    if (!scopesQuery) {
      res.status(400).send("Missing 'scopes' query parameter.");
      return;
    }
    if (!uid) {
      res.status(400).send("Missing 'uid' query parameter. User must be signed in.");
      return;
    }

    const scopes = scopesQuery.split(" ");
    const stateData = {
      uid: uid,
      scopes: scopes,
      frontendRedirect: req.headers.referer || "/", // Keep using referer or pass explicit redirect
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      state: state,
    });
    res.redirect(authorizationUrl);
  }
);

export const oauthCallback_v1 = v2OnRequest(
  {
    region: FUNCTIONS_REGION_PARAM, // Pass param object directly
    secrets: [OAUTH_CLIENT_SECRET_PARAM]
  },
  async (req, res) => {
    const clientId = OAUTH_CLIENT_ID_PARAM.value();
    const clientSecret = OAUTH_CLIENT_SECRET_PARAM.value();
    const gcpProjectId = GCP_PROJECT_ID_PARAM.value();
    const functionsRegion = FUNCTIONS_REGION_PARAM.value();

    if (!clientId || !clientSecret || !gcpProjectId || !functionsRegion) {
        logger.error("OAuth parameters not fully configured for callback.");
        res.status(500).send("OAuth client callback configuration error on server.");
        return;
    }

    const redirectUri = `https://${functionsRegion}-${gcpProjectId}.cloudfunctions.net/oauthCallback_v1`;
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const code = req.query.code as string;
    const state = req.query.state as string;

    if (!code) {
      res.status(400).send("Missing 'code' in query parameter.");
      return;
    }
    if (!state) {
      res.status(400).send("Missing 'state' in query parameter.");
      return;
    }

    let parsedState: { uid: string, scopes: string[], frontendRedirect: string };
    try {
      parsedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    } catch (error) {
      logger.error("Invalid state parameter:", error);
      res.status(400).send("Invalid state parameter.");
      return;
    }

    const { uid, scopes, frontendRedirect } = parsedState;
    if (!uid) {
      logger.error("UID missing in state from OAuth callback.");
      res.status(400).send("Error: User context lost. Please try again.");
      return;
    }

    try {
      const { tokens } = await oauth2Client.getToken(code);
      if (tokens.refresh_token) {
        await db.collection("user_tokens").doc(uid).set(
          {
            refresh_token: tokens.refresh_token,
            granted_scopes: admin.firestore.FieldValue.arrayUnion(...scopes),
            last_updated: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        logger.info(`Refresh token stored/updated for UID: ${uid}`);
      } else {
        await db.collection("user_tokens").doc(uid).update({
          granted_scopes: admin.firestore.FieldValue.arrayUnion(...scopes),
          last_updated_no_new_refresh_token: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`Access token obtained for UID: ${uid} (no new refresh token). Scopes updated.`);
      }

      const redirectUrl = new URL(frontendRedirect || '/'); // Use a safe default
      redirectUrl.searchParams.set('oauth_status', 'success');
      let serviceName = 'google'; // Default service name
      if (scopes.some(s => s.includes('calendar'))) serviceName = 'calendar';
      if (scopes.some(s => s.includes('gmail'))) serviceName = 'gmail';
      redirectUrl.searchParams.set('service', serviceName);
      redirectUrl.searchParams.set('uid_placeholder', uid);
      res.redirect(redirectUrl.toString());

    } catch (error: any) {
      logger.error("Error exchanging auth code or storing tokens for UID " + uid + ":", error);
      const redirectUrl = new URL(frontendRedirect || '/');
      redirectUrl.searchParams.set('oauth_status', 'error');
      redirectUrl.searchParams.set('error_message', error.message || 'Token exchange failed.');
      res.redirect(redirectUrl.toString());
    }
  }
);

// Note: The onCall functions will be converted in the next step.
// For now, only initiateAuth_v1 and oauthCallback_v1 are converted.
// The HttpsError in getUserGoogleClient was already V2HttpsError.

export const revokeGoogleAccess_v1 = v2OnCall(
  {
    region: FUNCTIONS_REGION_PARAM,
    secrets: [OAUTH_CLIENT_SECRET_PARAM],
    cors: true // Added CORS option
  },
  async (request) => {
    if (!request.auth) {
      throw new V2HttpsError("unauthenticated", "Authentication required to revoke access.");
    }
    const uid = request.auth.uid;
    const serviceToRevoke = request.data?.service as string;

    if (!serviceToRevoke || !['calendar', 'gmail', 'all'].includes(serviceToRevoke)) {
      throw new V2HttpsError("invalid-argument", "Invalid 'service' parameter. Must be 'calendar', 'gmail', or 'all'.");
    }
    // Note: Removed duplicate serviceToRevoke definition and the v1 error throw that was still present.

    const userTokensRef = db.collection("user_tokens").doc(uid);
  const doc = await userTokensRef.get();

  if (!doc.exists) {
    logger.info(`No tokens found for user ${uid} to revoke. Already effectively revoked.`);
    return { success: true, message: "No active authorization found for this user." };
  }

  const tokensData = doc.data();
  const refreshToken = tokensData?.refresh_token;

  if (!refreshToken) {
    logger.info(`No refresh token found for user ${uid} to revoke. Already effectively revoked or token data incomplete.`);
    // Clean up potentially incomplete doc
    await userTokensRef.update({
        refresh_token: admin.firestore.FieldValue.delete(),
        granted_scopes: admin.firestore.FieldValue.delete(), // Clear scopes as well
    });
    return { success: true, message: "No active refresh token found." };
  }

  let firestoreUpdateData: {[key: string]: any} = {};
  let revocationMessage = "";

  // For Google, revoking a refresh token revokes all its permissions.
  // Granular revocation by scope isn't done by revoking the token itself, but by the user managing app permissions in their Google account.
  // Our action here is to revoke the token with Google and then update our Firestore record.
  // If 'all' or if any specific service is revoked, we revoke the master refresh token.
  // The distinction of 'calendar' vs 'gmail' in our Firestore `granted_scopes` is more for our app to know what was *intended* to be authorized.

  try {
    const response = await axios.post(`https://oauth2.googleapis.com/revoke?token=${refreshToken}`, null, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    if (response.status === 200) {
      logger.info(`Successfully revoked token for user ${uid} with Google.`);
      // Regardless of 'serviceToRevoke', if Google confirms revocation, the refresh token is invalid.
      // We should remove it and all associated scopes.
      firestoreUpdateData = {
        refresh_token: admin.firestore.FieldValue.delete(),
        granted_scopes: admin.firestore.FieldValue.delete(),
        last_revoked: admin.firestore.FieldValue.serverTimestamp(),
      };
      revocationMessage = `Access for all Google services has been revoked for user ${uid}.`;

      await userTokensRef.update(firestoreUpdateData);
      logger.info(`Cleared refresh token and scopes for user ${uid} in Firestore.`);
      return { success: true, message: revocationMessage };

    } else {
      // This case might not be typically hit if Google returns 200 even for already invalid tokens.
      // But good to have for unexpected responses.
      logger.warn(`Google token revocation for UID ${uid} returned status ${response.status}:`, response.data);
      // Don't delete from Firestore if Google didn't confirm, could be a temporary issue.
      throw new V2HttpsError("internal", `Google revocation failed with status: ${response.status}. Please try again.`);
    }
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      // Google often returns 200 even if the token is already invalid or malformed.
      // Specific error codes (e.g., 400 for invalid_token) might be in error.response.data.error.
      // If Google indicates the token is invalid, we can proceed to clear it from Firestore.
      logger.warn(`Error during Google token revocation request for UID ${uid}: (status: ${error.response.status})`, error.response.data);
      if (error.response.status === 400) { // Bad request, e.g. token already revoked or invalid
        logger.info(`Token for UID ${uid} was likely already invalid/revoked by Google. Clearing from Firestore.`);
        firestoreUpdateData = {
          refresh_token: admin.firestore.FieldValue.delete(),
          granted_scopes: admin.firestore.FieldValue.delete(),
          last_revoked_due_to_error: admin.firestore.FieldValue.serverTimestamp(),
        };
        await userTokensRef.update(firestoreUpdateData);
        return { success: true, message: "Token was already invalid or revoked. Cleaned up local record." };
      }
      throw new V2HttpsError("internal", `Failed to revoke Google token: ${error.response.data.error_description || error.message}`);
    }
    // Non-Axios error or no response
    logger.error(`Unexpected error during token revocation for UID ${uid}:`, error);
    throw new V2HttpsError("internal", `An unexpected error occurred during token revocation: ${error.message}`);
  }
});

export const getAuthStatus_v1 = v2OnCall(
  {
    region: FUNCTIONS_REGION_PARAM,
    cors: true // Added CORS option
  },
  async (request) => {
    if (!request.auth) {
      throw new V2HttpsError("unauthenticated", "Authentication required.");
    }
    const uid = request.auth.uid;
    const servicesToChecks = request.data?.services as string[] || ['calendar', 'gmail'];
  const status: { [key: string]: boolean } = {};

  try {
    const tokenDoc = await db.collection("user_tokens").doc(uid).get();
    const tokensData = tokenDoc.exists ? tokenDoc.data() : null;

    if (!tokensData || !tokensData.refresh_token) {
      servicesToChecks.forEach(service => status[service] = false);
      return { status };
    }

    // Check based on granted scopes
    const grantedScopes = tokensData.granted_scopes || [];
    for (const service of servicesToChecks) {
      if (service === 'calendar') {
        status['calendar'] = grantedScopes.some((s:string) => s.includes('calendar'));
      } else if (service === 'gmail') {
        status['gmail'] = grantedScopes.some((s:string) => s.includes('gmail'));
      } else {
        status[service] = false; // Unknown service
      }
    }
    return { status };
  } catch (error: any) { // Added type any for error
    logger.error(`Error fetching auth status for UID ${uid}:`, error);
    throw new V2HttpsError("internal", `Failed to retrieve authorization status: ${error.message}`);
  }
});

export const createCalendarEvent_v1 = v2OnCall(
  {
    region: FUNCTIONS_REGION_PARAM,
    secrets: [OAUTH_CLIENT_SECRET_PARAM], // For getUserGoogleClient
    cors: true // Added CORS option
  },
  async (request) => {
    if (!request.auth) {
      throw new V2HttpsError("unauthenticated", "Authentication required.");
    }
    const uid = request.auth.uid;
    const { summary, description, startTime, endTime, attendees, addMeet } = request.data;

    if (!summary || !startTime || !endTime) {
      throw new V2HttpsError("invalid-argument", "Missing required fields: summary, startTime, endTime.");
    }

    const requiredScopes = ['https://www.googleapis.com/auth/calendar.events'];
  try {
    const client = await getUserGoogleClient(uid, requiredScopes);
    const calendar = google.calendar({ version: 'v3', auth: client });

    const event: any = {
      summary: summary,
      description: description || '',
      start: {
        dateTime: startTime, // ISO 8601 format e.g., '2024-03-10T10:00:00-07:00'
        timeZone: request.data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endTime,
        timeZone: request.data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      attendees: attendees?.map((email: string) => ({ email })) || [],
    };

    if (addMeet) {
      event.conferenceData = {
        createRequest: {
          requestId: `meet-${uid}-${Date.now()}`, // Unique request ID
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      };
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: addMeet ? 1 : 0,
      sendUpdates: attendees && attendees.length > 0 ? 'all' : 'none', // Send updates if there are attendees
    });

    logger.info(`Calendar event created for UID ${uid}:`, response.data.id);
    return {
      eventId: response.data.id,
      eventUrl: response.data.htmlLink,
      meetLink: response.data.hangoutLink || null,
    };
  } catch (error: any) {
    logger.error(`Error creating calendar event for UID ${uid}:`, error);
    if (error instanceof V2HttpsError) throw error; // Check against V2HttpsError
    throw new V2HttpsError("internal", `Failed to create calendar event: ${error.message}`);
  }
});

export const listEmails_v1 = v2OnCall(
  {
    region: FUNCTIONS_REGION_PARAM,
    secrets: [OAUTH_CLIENT_SECRET_PARAM], // For getUserGoogleClient
    cors: true // Added CORS option
  },
  async (request) => {
    if (!request.auth) {
      throw new V2HttpsError("unauthenticated", "Authentication required.");
    }
    const uid = request.auth.uid;
    const maxResults = request.data?.maxResults || 10;

    const requiredScopes = ['https://www.googleapis.com/auth/gmail.readonly'];
  try {
    const client = await getUserGoogleClient(uid, requiredScopes);
    const gmail = google.gmail({ version: 'v1', auth: client });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
      q: request.data?.query || '', // Optional query string (e.g., 'is:unread')
    });

    const messages = response.data.messages || [];
    if (messages.length === 0) {
      return { emails: [] };
    }

    const emailDetails = await Promise.all(
      messages.map(async (message) => {
        if (!message.id) return null;
        try {
          const msg = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata', // Fetch snippet, subject, from
            metadataHeaders: ['Subject', 'From', 'Date'],
          });
          const subjectHeader = msg.data.payload?.headers?.find(h => h.name === 'Subject');
          const fromHeader = msg.data.payload?.headers?.find(h => h.name === 'From');
          const dateHeader = msg.data.payload?.headers?.find(h => h.name === 'Date');

          return {
            id: msg.data.id,
            threadId: msg.data.threadId,
            snippet: msg.data.snippet,
            subject: subjectHeader?.value || 'No Subject',
            from: fromHeader?.value || 'Unknown Sender',
            date: dateHeader?.value || '',
          };
        } catch (msgError) {
            logger.error(`Error fetching details for message ID ${message.id} for UID ${uid}:`, msgError);
            return { id: message.id, error: "Failed to fetch details" };
        }
      })
    );

    return { emails: emailDetails.filter(e => e !== null) };
  } catch (error: any) {
    logger.error(`Error listing emails for UID ${uid}:`, error);
    if (error instanceof V2HttpsError) throw error; // Check against V2HttpsError
    throw new V2HttpsError("internal", `Failed to list emails: ${error.message}`);
  }
});


// --- Existing AI Related Functions (Now using v2OnRequest and ES Module exports) ---
export const claudeChat = v2OnRequest({ cors: true, secrets: [ANTHROPIC_API_KEY_PARAM] }, async (req, res) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, image, imageType } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: "Message or image is required" });
    }

    // Get the API key from environment variable
    const ANTHROPIC_API_KEY = ANTHROPIC_API_KEY_PARAM.value(); // Use the defined param

    if (!ANTHROPIC_API_KEY) {
      logger.error("Anthropic API key not configured or available."); // Use logger
      return res.status(500).json({ error: "API key not configured" });
    }

    let requestBody = {
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 2000,
      messages: [],
    };

    // Handle image + text or text only
    if (image) {
      // For image analysis, create a message with both image and text
      const content = [];

      // Add image to content
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: imageType || "image/jpeg",
          data: image,
        },
      });

      // Add text prompt for attendance analysis
      content.push({
        type: "text",
        text:
          message ||
          `Please analyze this attendance register image and extract the structured data. Return the data in JSON format with the following structure:
        {
          "employees": [
            {
              "name": "Employee Name",
              "attendance": {
                "1": "P/A/S", // Day 1 status
                "2": "P/A/S", // Day 2 status
                // ... for all days shown
              }
            }
          ],
          "legend": {
            "P": "Present",
            "A": "Absent",
            "S": "Sick/Leave"
          }
        }

        Extract all employee names and their daily attendance status. Use 'P' for Present, 'A' for Absent, and 'S' for Sick/Leave or other special codes.`,
      });

      requestBody.messages.push({
        role: "user",
        content: content,
      });
    } else {
      // Text only message
      requestBody.messages.push({
        role: "user",
        content: message,
      });
    }

    // Call Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Claude API error:", errorData);
      return res
        .status(500)
        .json({ error: "Failed to get response from Claude" });
    }

    const data = await response.json();

    // Extract the response text from Claude's response
    const claudeResponse = data.content[0].text;

    return res.status(200).json({
      response: claudeResponse,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export const generateProjectIdeasFn = v2OnRequest({ cors: true }, async (req, res) => {
  try {
    const response = await generateProjectIdeas(req.body);
    logger.info("inside generateProjectIdeasFn response ", response);
    return res.status(200).json({ response });
  } catch (error: any) {
    logger.error("Error in generateProjectIdeasFn:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

export const generateProjectPlanFn = v2OnRequest({ cors: true }, async (req, res) => {
  try {
    const response = await generateProjectPlan(req.body);
    logger.info("inside generateProjectPlanFn response ", response);
    return res.status(200).json({ response });
  } catch (error: any) {
    logger.error("Error in generateProjectPlanFn:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

export const suggestTaskHintsFn = v2OnRequest({ cors: true }, async (req, res) => {
  try {
    const response = await suggestTaskHints(req.body);
    logger.info("inside suggestTaskHints response ", response);
    return res.status(200).json({ response });
  } catch (error: any) {
    logger.error("Error in suggestTaskHintsFn:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

export const generateCurriculumSuggestionsFn = v2OnRequest(
  { cors: true, secrets: [ANTHROPIC_API_KEY_PARAM] }, // Assuming this function might also need the API key
  async (req, res) => {
    try {
      // If generateCurriculumSuggestions uses the API key, it should be accessed via ANTHROPIC_API_KEY_PARAM.value()
      // For example: const apiKey = ANTHROPIC_API_KEY_PARAM.value();
      // And then pass apiKey to generateCurriculumSuggestions if it needs it.
      // This detail depends on the implementation of generateCurriculumSuggestions.
      const response = await generateCurriculumSuggestions(req.body);
      logger.info("inside generateCurriculumSuggestionsFn response ", response);
      return res.status(200).json({ response });
    } catch (error: any) {
      logger.error("Error in generateCurriculumSuggestionsFn:", error);
      return res.status(500).json({ error: "Internal server error", details: error.message });
    }
  }
);
