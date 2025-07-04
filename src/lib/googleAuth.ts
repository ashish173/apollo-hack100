import { GoogleService } from '@/components/hrportal/GoogleServiceCheckboxes';

const CLIENT_ID = '486228852542-l9auo9ioo3mtmju11om5g99pb7dhapbq.apps.googleusercontent.com';

const SCOPES: Record<GoogleService, string> = {
  gmail: 'https://www.googleapis.com/auth/gmail.modify',
  calendar: 'https://www.googleapis.com/auth/calendar',
  meet: 'https://www.googleapis.com/auth/calendar', // Meet permissions via Calendar events
};

let gisLoaded = false;
function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gisLoaded) return resolve();
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      gisLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

const accessTokens: Partial<Record<GoogleService, string>> = {};

export async function requestGoogleServiceAuth(service: GoogleService): Promise<boolean> {
  await loadGisScript();
  return new Promise((resolve) => {
    // @ts-ignore
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES[service],
      prompt: 'consent',
      callback: (resp: any) => {
        if (resp && resp.access_token) {
          accessTokens[service] = resp.access_token;
          resolve(true);
        } else {
          console.error('OAuth consent flow failed for', service, resp);
          resolve(false);
        }
      },
    });
    tokenClient.requestAccessToken();
  });
}

export async function checkGoogleServiceAuth(service: GoogleService): Promise<boolean> {
  await loadGisScript();
  return new Promise((resolve) => {
    // @ts-ignore
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES[service],
      prompt: 'none', // silent
      callback: (resp: any) => {
        console.log('Silent check response for', service, resp);
        if (resp && resp.access_token) {
          accessTokens[service] = resp.access_token;
          resolve(true);
        } else {
          console.warn('Silent check failed for', service, resp);
          resolve(false);
        }
      },
    });
    tokenClient.requestAccessToken();
  });
}

export function getGoogleServiceAccessToken(service: GoogleService): string | undefined {
  return accessTokens[service];
} 