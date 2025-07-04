// @ts-nocheck
// Existing AI related imports
import { generateProjectIdeas } from "./ai/flows/generate-project-ideas";
import { logger } from "firebase-functions/v2";
import { generateProjectPlan } from "./ai/flows/generate-project-plan";
import { suggestTaskHints } from "./ai/flows/suggest-task-hints";
import { generateCurriculumSuggestions } from "./ai/flows/generate-curriculum-suggestions";

// Existing v2 functions and params
const { onRequest } = require("firebase-functions/v2/https"); // Used by existing functions
const { defineString } = require("firebase-functions/params"); // Used by existing functions

// --- New Imports for Google API Integration ---
import * as admin from "firebase-admin";
import * as functions from "firebase-functions"; // v1 functions for Google API integration
import { google, Auth } from "googleapis";
import { OAuth2Client } from "google-auth-library";

// --- Initialize Firebase Admin SDK (if not already initialized) ---
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// --- Configuration for existing AI functions ---
const anthropicApiKey = defineString("ANTHROPIC_API_KEY");


// --- Configuration for Google OAuth ---
// IMPORTANT: Set these in your Firebase environment configuration
// firebase functions:config:set oauth.client_id="YOUR_CLIENT_ID"
// firebase functions:config:set oauth.client_secret="YOUR_CLIENT_SECRET"
// firebase functions:config:set oauth.project_id="YOUR_GCP_PROJECT_ID" (e.g. my-firebase-project)
// firebase functions:config:set oauth.region="us-central1" (or your function's region)

const OAUTH_CLIENT_ID = functions.config().oauth?.client_id;
const OAUTH_CLIENT_SECRET = functions.config().oauth?.client_secret;
const GCP_PROJECT_ID = functions.config().oauth?.project_id;
const FUNCTIONS_REGION = functions.config().oauth?.region || "us-central1";

const REDIRECT_URI = `https://${FUNCTIONS_REGION}-${GCP_PROJECT_ID}.cloudfunctions.net/oauthCallback_v1`; // Added _v1 to distinguish if needed

if (!OAUTH_CLIENT_ID || !OAUTH_CLIENT_SECRET || !GCP_PROJECT_ID) {
  console.error(
    "OAuth client ID, secret, or GCP Project ID is not configured in Firebase functions config. " +
    "Run: firebase functions:config:set oauth.client_id=\"YOUR_ID\" oauth.client_secret=\"YOUR_SECRET\" oauth.project_id=\"YOUR_GCP_PROJECT_ID\" [oauth.region=\"YOUR_REGION\"]"
  );
}

const baseOAuth2Client: OAuth2Client = new google.auth.OAuth2(
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
  REDIRECT_URI
);

// --- Helper Function to Get Authenticated Google API Client ---
/**
 * Creates and returns an OAuth2Client authenticated with the user's stored refresh token.
 * Refreshes the access token if necessary.
 * @param {string} uid Firebase User ID.
 * @param {string[]} requiredScopes Scopes needed for the intended API call.
 * @return {Promise<OAuth2Client>} Authenticated OAuth2Client.
 * @throws {functions.https.HttpsError} If user is not authorized or token refresh fails.
 */
async function getUserGoogleClient(uid: string, requiredScopes: string[]): Promise<OAuth2Client> {
  const userTokensRef = db.collection("user_tokens").doc(uid);
  const doc = await userTokensRef.get();

  if (!doc.exists) {
    logger.error(`No tokens found for user ${uid}. Re-authorization needed.`);
    throw new functions.https.HttpsError("permission-denied", "User credentials not found. Please authorize the application for the required Google services.");
  }

  const tokens = doc.data();
  if (!tokens?.refresh_token) {
    logger.error(`No refresh token for user ${uid}. Re-authorization needed.`);
    await userTokensRef.delete(); // Clean up invalid token entry
    throw new functions.https.HttpsError("permission-denied", "User refresh token not found. Please re-authorize the application.");
  }

  const client = new google.auth.OAuth2(OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET);
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
      // Optionally, update stored access_token and expiry_date in Firestore if you use them elsewhere.
      // For server-side functions, relying on refresh_token for each new client instance is often sufficient.
      logger.info(`Token refreshed for user ${uid}.`);
    } catch (error: any) {
      logger.error(`Failed to refresh token for user ${uid}:`, error);
      // If refresh fails (e.g., token revoked by user), delete stored token and throw.
      await userTokensRef.delete();
      throw new functions.https.HttpsError("permission-denied", `Failed to refresh access token: ${error.message}. Please re-authorize the application.`);
    }
  }
  return client;
}


// --- Google API Integration Functions (v1) ---

export const initiateAuth_v1 = functions.https.onRequest(async (req, res) => {
  const scopesQuery = req.query.scopes as string;
  const uid = req.query.uid as string;

  if (!OAUTH_CLIENT_ID) { // Check if config loaded
      res.status(500).send("OAuth client not configured on server.");
      return;
  }

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
    frontendRedirect: req.headers.referer || "/",
  };
  const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

  const authorizationUrl = baseOAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
    state: state,
  });
  res.redirect(authorizationUrl);
});

export const oauthCallback_v1 = functions.https.onRequest(async (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state as string;

  if (!OAUTH_CLIENT_ID) { // Check if config loaded
      res.status(500).send("OAuth client not configured on server.");
      return;
  }

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
    const { tokens } = await baseOAuth2Client.getToken(code);
    if (tokens.refresh_token) {
      await db.collection("user_tokens").doc(uid).set(
        {
          refresh_token: tokens.refresh_token,
          granted_scopes: admin.firestore.FieldValue.arrayUnion(...scopes), // Store granted scopes
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

    const redirectUrl = new URL(frontendRedirect || '/');
    redirectUrl.searchParams.set('oauth_status', 'success');
    // Determine service based on scopes for better feedback
    let serviceName = 'google';
    if (scopes.some(s => s.includes('calendar'))) serviceName = 'calendar';
    if (scopes.some(s => s.includes('gmail'))) serviceName = 'gmail'; // Gmail might override calendar if both present
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
});

export const getAuthStatus_v1 = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  const uid = context.auth.uid;
  const servicesToChecks = data?.services as string[] || ['calendar', 'gmail'];
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
  } catch (error) {
    logger.error(`Error fetching auth status for UID ${uid}:`, error);
    throw new functions.https.HttpsError("internal", "Failed to retrieve authorization status.");
  }
});

export const createCalendarEvent_v1 = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  const uid = context.auth.uid;
  const { summary, description, startTime, endTime, attendees, addMeet } = data;

  if (!summary || !startTime || !endTime) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required fields: summary, startTime, endTime.");
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
        timeZone: data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone, // Optional: data.timeZone
      },
      end: {
        dateTime: endTime,
        timeZone: data.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
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
    });

    logger.info(`Calendar event created for UID ${uid}:`, response.data.id);
    return {
      eventId: response.data.id,
      eventUrl: response.data.htmlLink,
      meetLink: response.data.hangoutLink || null,
    };
  } catch (error: any) {
    logger.error(`Error creating calendar event for UID ${uid}:`, error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", `Failed to create calendar event: ${error.message}`);
  }
});

export const listEmails_v1 = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  const uid = context.auth.uid;
  const maxResults = data?.maxResults || 10;

  const requiredScopes = ['https://www.googleapis.com/auth/gmail.readonly'];
  try {
    const client = await getUserGoogleClient(uid, requiredScopes);
    const gmail = google.gmail({ version: 'v1', auth: client });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
      q: data?.query || '', // Optional query string (e.g., 'is:unread')
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
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", `Failed to list emails: ${error.message}`);
  }
});


// --- Existing AI Related Functions ---
// (claudeChat, generateProjectIdeasFn, etc. remain below)
exports.claudeChat = onRequest({ cors: true }, async (req, res) => {
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
    const ANTHROPIC_API_KEY = anthropicApiKey.value();

    if (!ANTHROPIC_API_KEY) {
      console.error("Anthropic API key not configured");
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

exports.generateProjectIdeasFn = onRequest({ cors: true }, async (req, res) => {
  try {
    const response = await generateProjectIdeas(req.body);
    logger.info("inside generateProjectIdeasFn response ", response);

    return res.status(200).json({
      response: response,
    });

    return;
  } catch (error) {
    return {
      error: "Firebase error",
    };
  }
});

exports.generateProjectPlanFn = onRequest({ cors: true }, async (req, res) => {
  try {
    const response = await generateProjectPlan(req.body);
    logger.info("inside generateProjectPlanFn response ", response);

    return res.status(200).json({
      response: response,
    });

    return;
  } catch (error) {
    return {
      error: "Firebase error",
    };
  }
});

exports.suggestTaskHintsFn = onRequest({ cors: true }, async (req, res) => {
  try {
    const response = await suggestTaskHints(req.body);
    logger.info("inside suggestTaskHints response ", response);

    return res.status(200).json({
      response: response,
    });

    return;
  } catch (error) {
    return {
      error: "Firebase error",
    };
  }
});

exports.generateCurriculumSuggestionsFn = onRequest(
  { cors: true },
  async (req, res) => {
    try {
      const response = await generateCurriculumSuggestions(req.body);
      logger.info("inside generateCurriculumSuggestionsFn response ", response);

      return res.status(200).json({
        response: response,
      });

      return;
    } catch (error) {
      return {
        error: "Firebase error",
      };
    }
  }
);
