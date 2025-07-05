'use client';

import React, { useState, useEffect, useCallback } from 'react';
// Removed duplicate React import
import { useAuth } from '@/context/auth-context'; // Assuming this provides Firebase user
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getApp } from 'firebase/app';

const SchedulePage = () => {
  const { user } = useAuth(); // Get user from AuthContext. User object from Firebase Auth.
  const [calendarAuthorized, setCalendarAuthorized] = useState(false);
  const [gmailAuthorized, setGmailAuthorized] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true); // For auth status
  const [error, setError] = useState<string | null>(null); // For general errors

  // State for Calendar Event Creation
  const [eventSummary, setEventSummary] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventAttendees, setEventAttendees] = useState('');
  const [addMeetLink, setAddMeetLink] = useState(true);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [eventCreationMessage, setEventCreationMessage] = useState<string | null>(null);
  const [eventCreationError, setEventCreationError] = useState<string | null>(null);


  const fetchAuthStatus = useCallback(async () => {
    if (!user) {
      setLoadingStatus(false);
      // Reset statuses if user logs out or is not yet available
      setCalendarAuthorized(false);
      setGmailAuthorized(false);
      return;
    }
    setLoadingStatus(true);
    setError(null);
    // console.log('Fetching auth status for user:', user.uid);

    try {
      const functionsInstance = getFunctions(getApp());
      if (process.env.NODE_ENV === 'development' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
        try {
          // console.log("Attempting to connect to Functions Emulator for getAuthStatus_v1");
          connectFunctionsEmulator(functionsInstance, "localhost", 5001);
        } catch (e: any) {
          // Emulator might already be connected, or other connection issue. Log as warning.
          if (e.code !== 'functions/emulator-already-connected') {
            console.warn("Functions emulator connection issue (may be harmless if already connected):", e.message);
          }
        }
      }
      const getAuthStatusFn = httpsCallable(functionsInstance, 'getAuthStatus_v1');
      const response = await getAuthStatusFn({ services: ['calendar', 'gmail'] });
      const statusData = response.data as { status: { calendar: boolean, gmail: boolean } };
      setCalendarAuthorized(statusData.status.calendar);
      setGmailAuthorized(statusData.status.gmail);
    } catch (err: any) {
      console.error("Error fetching auth status:", err);
      setError(err.message || 'Failed to fetch authorization status.');
    } finally {
      setLoadingStatus(false);
    }
  }, [user]);

  useEffect(() => {
    // Fetch status when user object becomes available or changes.
    fetchAuthStatus();
  }, [user, fetchAuthStatus]);

  // Effect to handle OAuth callback messages passed via query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get('oauth_status');
    const serviceCallback = params.get('service'); // Changed from service_oauth_done to service
    const returnedUid = params.get('uid_placeholder');

    if (oauthStatus && serviceCallback && user && user.uid === returnedUid) {
      if (oauthStatus === 'success') {
        console.log(`${serviceCallback} authorization successful, refreshing status.`);
        fetchAuthStatus();
      } else if (oauthStatus === 'error') {
        const errorMessage = params.get('error_message') || 'Unknown error during authorization.';
        setError(`Authorization failed for ${serviceCallback}: ${errorMessage}`);
        console.error(`OAuth Error for ${serviceCallback}: ${errorMessage}`);
      }

      // Clean URL by removing these specific query parameters
      params.delete('oauth_status');
      params.delete('service'); // Changed from service_oauth_done
      params.delete('uid_placeholder');
      params.delete('error_message');
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [user, fetchAuthStatus]);


  const handleAuthorize = (serviceTarget: 'calendar' | 'gmail') => {
    if (!user) {
      setError("Please sign in to authorize services.");
      alert("Please sign in to authorize services.");
      return;
    }

    let scopes = "";
    if (serviceTarget === 'calendar') {
      // Using only calendar.events as it should be sufficient for creating events and adding attendees.
      // The broader /auth/calendar scope is likely not needed for current features.
      scopes = "https://www.googleapis.com/auth/calendar.events";
    } else if (serviceTarget === 'gmail') {
      scopes = "https://www.googleapis.com/auth/gmail.readonly";
    } else {
      setError("Unknown service for authorization.");
      return;
    }

    const functionName = 'initiateAuth_v1';
    let initiateAuthUrl = '';

    const firebaseApp = getApp();
    const projectId = firebaseApp.options.projectId;
    const functionsRegion = firebaseApp.options.locationId || 'us-central1'; // GCP location ID for functions if set, else default

    if (!projectId) {
        alert("Firebase Project ID not found in app configuration. Cannot construct function URL.");
        setError("Firebase Project ID not found.");
        return;
    }

    if (process.env.NODE_ENV === 'development' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
      // Construct emulator URL. Ensure functions emulator is running at localhost:5001.
      initiateAuthUrl = `http://localhost:5001/${projectId}/${functionsRegion}/${functionName}?scopes=${encodeURIComponent(scopes)}&uid=${user.uid}`;
      // console.log("Using emulator URL for auth: ", initiateAuthUrl);
    } else {
      // Deployed: Construct absolute URL for the function.
      initiateAuthUrl = `https://${functionsRegion}-${projectId}.cloudfunctions.net/${functionName}?scopes=${encodeURIComponent(scopes)}&uid=${user.uid}`;
      // console.log("Using deployed/absolute URL for auth: ", initiateAuthUrl);
    }

    // Store current path to potentially redirect back after OAuth, if backend doesn't handle it via referer.
    // The backend's `oauthCallback_v1` uses `req.headers.referer` or `/` as frontendRedirect.
    // To ensure it comes back to *this* page, we could pass it in the state param of initiateAuth_v1.
    // For now, the current implementation of initiateAuth_v1 already includes `req.headers.referer` in the state.
    window.location.href = initiateAuthUrl;
  };

  const handleRevoke = async (serviceTarget: 'calendar' | 'gmail') => {
    if (!user) {
      setError("Please sign in to revoke access.");
      alert("Please sign in to revoke access."); // For immediate feedback
      return;
    }

    const confirmation = window.confirm(
      `Are you sure you want to revoke access for ${serviceTarget === 'calendar' ? 'Google Calendar & Meet' : 'Google Gmail'}? This will remove the application's ability to access this service on your behalf.`
    );

    if (!confirmation) {
      return;
    }

    setLoadingStatus(true);
    setError(null);
    // console.log(`Attempting to revoke ${serviceTarget} for user ${user.uid}`);

    try {
      const functionsInstance = getFunctions(getApp());
      if (process.env.NODE_ENV === 'development' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
         try {
            // console.log("Attempting to connect to Functions Emulator for revokeGoogleAccess_v1");
            connectFunctionsEmulator(functionsInstance, "localhost", 5001);
        } catch (e: any) {
          if (e.code !== 'functions/emulator-already-connected') { // SDK might throw if already connected
            console.warn("Functions emulator connection issue (revoke):", e.message);
          }
        }
      }
      const revokeAccessFn = httpsCallable(functionsInstance, 'revokeGoogleAccess_v1');
      // Pass 'all' because revoking a refresh token typically revokes all its scopes.
      // The backend function `revokeGoogleAccess_v1` is designed to handle this by deleting the main refresh token.
      // The 'serviceTarget' can be used for UI messages if needed, but backend action is holistic.
      const response = await revokeAccessFn({ service: 'all' }); // Or pass serviceTarget if backend handles it granularly for Firestore cleanup

      const responseData = response.data as { success: boolean; message: string };

      if (responseData.success) {
        // alert(responseData.message || `Access for ${serviceTarget} revoked successfully.`);
        console.log(responseData.message || `Access for ${serviceTarget} revoked successfully.`);
        // Refreshing auth status will update the UI for both calendar and gmail
        await fetchAuthStatus();
      } else {
        throw new Error(responseData.message || `Failed to revoke access for ${serviceTarget}.`);
      }
    } catch (err: any) {
      console.error(`Error revoking ${serviceTarget} access:`, err);
      setError(err.message || `Failed to revoke access for ${serviceTarget}. Please try again.`);
      setLoadingStatus(false); // Ensure loading is stopped on error if fetchAuthStatus isn't called
    }
    // setLoadingStatus(false) is effectively handled by fetchAuthStatus or the error catch block.
  };

  const handleCreateEvent = async () => {
    if (!user) {
      setEventCreationError("You must be logged in to create an event.");
      return;
    }
    if (!eventSummary || !eventStartTime || !eventEndTime) {
      setEventCreationError("Please fill in Summary, Start Time, and End Time for the event.");
      return;
    }
    if (new Date(eventStartTime) >= new Date(eventEndTime)) {
      setEventCreationError("Event end time must be after start time.");
      return;
    }

    setCreatingEvent(true);
    setEventCreationMessage(null);
    setEventCreationError(null);

    const attendeesArray = eventAttendees.split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);

    try {
      const functionsInstance = getFunctions(getApp());
      if (process.env.NODE_ENV === 'development' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
        try {
          connectFunctionsEmulator(functionsInstance, "localhost", 5001);
        } catch (e: any) {
          if (e.code !== 'functions/emulator-already-connected') {
            console.warn("Functions emulator connection issue (createEvent):", e.message);
          }
        }
      }
      const createEventFn = httpsCallable(functionsInstance, 'createCalendarEvent_v1');
      const result = await createEventFn({
        summary: eventSummary,
        description: eventDescription,
        startTime: new Date(eventStartTime).toISOString(),
        endTime: new Date(eventEndTime).toISOString(),
        attendees: attendeesArray,
        addMeet: addMeetLink,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      const resultData = result.data as { eventId?: string; eventUrl?: string; meetLink?: string; message?: string };

      if (resultData.eventId) {
        setEventCreationMessage(
        `Event created! ID: ${resultData.eventId}. URL: ${resultData.eventUrl || 'N/A'}. Meet: ${resultData.meetLink || 'N/A'}`
        );
        // Clear form
        setEventSummary('');
        setEventDescription('');
        setEventStartTime('');
        setEventEndTime('');
        setEventAttendees('');
        setAddMeetLink(true);
      } else {
        throw new Error(resultData.message || "Unknown error creating event.");
      }
    } catch (err: any) {
      console.error("Error creating event:", err);
      setEventCreationError(err.message || "Failed to create event.");
    } finally {
      setCreatingEvent(false);
    }
  };

  // Loading state from useAuth() can also be used here if provided by the context
  // const { loading: authContextLoading } = useAuth();
  // if (authContextLoading) {
  //   return <div className="p-6 text-center">Loading user session...</div>;
  // }

  if (!user) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-lg text-gray-700">Please log in to manage your Google service integrations.</p>
        {/* Optionally, include a login button or redirect logic here if not handled globally by your app's auth flow */}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-semibold mb-6 text-gray-800">Manage Google Service Integrations</h1>

      {user && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-gray-700">Logged in as: <span className="font-medium">{user.email || 'N/A'}</span> (UID: {user.uid})</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
          <p>Error: {error}</p>
        </div>
      )}

      {loadingStatus ? (
        <p className="text-gray-600">Loading authorization status...</p>
      ) : (
        <div className="space-y-6">
          {/* Google Calendar & Meet Integration */}
          <div className="p-4 border rounded-md bg-gray-50">
            <h2 className="text-xl font-medium mb-3 text-gray-700">Google Calendar & Meet</h2>
            <p className="mb-3 text-sm">
              Status: {calendarAuthorized ?
                <span className="font-semibold text-green-600">Authorized</span> :
                <span className="font-semibold text-red-600">Not Authorized</span>
              }
            </p>
            {!calendarAuthorized ? (
              <button
                onClick={() => handleAuthorize('calendar')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
              >
                Authorize Calendar & Meet
              </button>
            ) : (
              <button
                onClick={() => handleRevoke('calendar')}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
              >
                Revoke Calendar & Meet Access
              </button>
            )}
            <p className="mt-2 text-xs text-gray-500">Allows creating calendar events and adding Google Meet links.</p>

            {/* Calendar Event Creation Form - Shown if Authorized */}
            {calendarAuthorized && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium mb-4 text-gray-700">Create Calendar Event</h3>
                <form onSubmit={(e) => { e.preventDefault(); /* handleCreateEvent will be called by button */ }} className="space-y-4">
                  <div>
                    <label htmlFor="event-summary" className="block text-sm font-medium text-gray-700">Summary/Title</label>
                    <input
                      type="text"
                      id="event-summary"
                      value={eventSummary}
                      onChange={(e) => setEventSummary(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="event-description" className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                    <textarea
                      id="event-description"
                      value={eventDescription}
                      onChange={(e) => setEventDescription(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="event-start-time" className="block text-sm font-medium text-gray-700">Start Time</label>
                      <input
                        type="datetime-local"
                        id="event-start-time"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="event-end-time" className="block text-sm font-medium text-gray-700">End Time</label>
                      <input
                        type="datetime-local"
                        id="event-end-time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="event-attendees" className="block text-sm font-medium text-gray-700">Attendees (comma-separated emails)</label>
                    <textarea
                      id="event-attendees"
                      value={eventAttendees}
                      onChange={(e) => setEventAttendees(e.target.value)}
                      rows={2}
                      placeholder="guest1@example.com, guest2@example.com"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      id="add-meet-link"
                      type="checkbox"
                      checked={addMeetLink}
                      onChange={(e) => setAddMeetLink(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="add-meet-link" className="ml-2 block text-sm text-gray-900">
                      Add Google Meet Link
                    </label>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleCreateEvent}
                      disabled={creatingEvent || !calendarAuthorized || !user}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {creatingEvent ? 'Creating...' : 'Create Event'}
                    </button>
                  </div>
                  {eventCreationMessage && (
                    <p className="mt-2 text-sm text-green-600">{eventCreationMessage}</p>
                  )}
                  {eventCreationError && (
                    <p className="mt-2 text-sm text-red-600">{eventCreationError}</p>
                  )}
                </form>
              </div>
            )}
          </div>

          {/* Google Gmail Integration */}
          <div className="p-4 border rounded-md bg-gray-50">
            <h2 className="text-xl font-medium mb-3 text-gray-700">Google Gmail</h2>
            <p className="mb-3 text-sm">
              Status: {gmailAuthorized ?
                <span className="font-semibold text-green-600">Authorized</span> :
                <span className="font-semibold text-red-600">Not Authorized</span>
              }
            </p>
            {!gmailAuthorized ? (
              <button
                onClick={() => handleAuthorize('gmail')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
              >
                Authorize Gmail
              </button>
            ) : (
              <button
                onClick={() => handleRevoke('gmail')}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out"
              >
                Revoke Gmail Access
              </button>
            )}
            <p className="mt-2 text-xs text-gray-500">Allows reading email messages (subjects, snippets).</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
