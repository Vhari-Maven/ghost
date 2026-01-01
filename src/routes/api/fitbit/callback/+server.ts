import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { storeFitbitToken } from '$lib/services/fitbit';

const FITBIT_TOKEN_URL = 'https://api.fitbit.com/oauth2/token';

interface FitbitTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
  scope: string;
  token_type: string;
}

export const GET: RequestHandler = async ({ url }) => {
  const code = url.searchParams.get('code');
  const errorParam = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Handle OAuth errors
  if (errorParam) {
    console.error('[Fitbit OAuth] Error:', errorParam, errorDescription);
    throw redirect(302, `/settings?error=${encodeURIComponent(errorDescription || errorParam)}`);
  }

  // Validate authorization code
  if (!code) {
    throw error(400, 'Missing authorization code');
  }

  const redirectUri = `${url.origin}/api/fitbit/callback`;

  try {
    // Exchange code for tokens
    const credentials = Buffer.from(`${env.FITBIT_CLIENT_ID}:${env.FITBIT_CLIENT_SECRET}`).toString('base64');

    const response = await fetch(FITBIT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Fitbit OAuth] Token exchange failed:', response.status, errorText);
      throw redirect(302, `/settings?error=${encodeURIComponent('Failed to exchange authorization code')}`);
    }

    const data: FitbitTokenResponse = await response.json();

    // Store the tokens
    await storeFitbitToken(
      data.access_token,
      data.refresh_token,
      data.expires_in,
      data.user_id,
      data.scope
    );

    console.log('[Fitbit OAuth] Successfully connected!');

    // Redirect to settings with success message
    throw redirect(302, '/settings?success=fitbit_connected');

  } catch (err) {
    // Re-throw redirects
    if (err instanceof Response || (err && typeof err === 'object' && 'status' in err)) {
      throw err;
    }

    console.error('[Fitbit OAuth] Callback error:', err);
    throw redirect(302, `/settings?error=${encodeURIComponent('OAuth callback failed')}`);
  }
};
