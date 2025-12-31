import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

const FITBIT_AUTH_URL = 'https://www.fitbit.com/oauth2/authorize';

// Scopes we need for heart rate, sleep, and activity (calories)
const SCOPES = ['heartrate', 'sleep', 'activity'].join(' ');

export const GET: RequestHandler = async ({ url }) => {
  const redirectUri = `${url.origin}/api/fitbit/callback`;

  // Debug logging
  console.log('[Fitbit OAuth] Origin:', url.origin);
  console.log('[Fitbit OAuth] Redirect URI:', redirectUri);
  console.log('[Fitbit OAuth] Client ID:', env.FITBIT_CLIENT_ID ? `${env.FITBIT_CLIENT_ID.slice(0, 6)}...` : 'NOT SET');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.FITBIT_CLIENT_ID || '',
    redirect_uri: redirectUri,
    scope: SCOPES,
    expires_in: '31536000' // 1 year (maximum)
  });

  const authUrl = `${FITBIT_AUTH_URL}?${params.toString()}`;

  console.log('[Fitbit OAuth] Full auth URL:', authUrl);

  throw redirect(302, authUrl);
};
