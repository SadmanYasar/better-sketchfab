import { env } from 'cloudflare:workers';

const SKETCHFAB_TOKEN_COOKIE = 'sketchfab_token';
export const SKETCHFAB_STATE_COOKIE = 'sketchfab_oauth_state';

export function getSketchfabCredentials(): { clientId: string; clientSecret: string } {
  return {
    clientId: env.SKETCHFAB_CLIENT_ID || process.env.SKETCHFAB_CLIENT_ID || '',
    clientSecret: env.SKETCHFAB_CLIENT_SECRET || process.env.SKETCHFAB_CLIENT_SECRET || '',
  };
}

export function generateOAuthState(): string {
  return crypto.randomUUID();
}

export function verifyOAuthState(state: string | null, cookieValue: string | null): boolean {
  return typeof state === 'string' && state.length > 0 && state === cookieValue;
}

export function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function stateCookieHeader(state: string): string {
  return `${SKETCHFAB_STATE_COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
}

export interface ExchangeCodeInput {
  code: string;
  clientId?: string;
  clientSecret?: string;
  redirectUri: string;
}

export interface ExchangeCodeResult {
  status: number;
  body: Record<string, unknown>;
  setCookie?: string;
}

export async function exchangeSketchfabCode(input: ExchangeCodeInput): Promise<ExchangeCodeResult> {
  const { code } = input;
  const creds = getSketchfabCredentials();
  const cId = input.clientId || creds.clientId;
  const cSecret = input.clientSecret || creds.clientSecret;

  if (!cId || !cSecret || !code) {
    return {
      status: 400,
      body: { error: 'Code, client_id, and client_secret are required' },
    };
  }

  try {
    const tokenRes = await fetch('https://sketchfab.com/oauth2/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: cId,
        client_secret: cSecret,
        redirect_uri: input.redirectUri,
      }).toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return {
        status: tokenRes.status,
        body: { error: 'Token exchange failed', details: errText },
      };
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };
    const accessToken = tokenData.access_token;

    const userRes = await fetch('https://api.sketchfab.com/v3/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const user = userRes.ok ? await userRes.json() : null;

    return {
      status: 200,
      body: { success: true, token: accessToken, user, authType: 'Bearer' },
      setCookie: `${SKETCHFAB_TOKEN_COOKIE}=${accessToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${30 * 24 * 60 * 60}`,
    };
  } catch (err: any) {
    return { status: 500, body: { error: err.message } };
  }
}

export interface BuildAuthUrlInput {
  origin: string;
  clientId?: string | null;
  state?: string | null;
}

export function buildSketchfabAuthUrl(input: BuildAuthUrlInput) {
  const creds = getSketchfabCredentials();
  const clientId = input.clientId || creds.clientId;
  const redirectUri = `${input.origin}/auth/callback`;

  if (!clientId) {
    return {
      status: 400,
      body: {
        error: 'NO_CLIENT_ID',
        message:
          'Sketchfab OAuth Client ID is missing. Please configure SKETCHFAB_CLIENT_ID in your environment or enter it in the OAuth modal.',
        redirectUri,
      },
    };
  }

  const state = input.state || generateOAuthState();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  const authUrl = `https://sketchfab.com/oauth2/authorize/?${params.toString()}`;

  return {
    status: 200,
    body: { url: authUrl, clientId, redirectUri },
    state,
    setCookie: stateCookieHeader(state),
  };
}

export function responseFromResult(result: {
  status: number;
  body: Record<string, unknown>;
  setCookie?: string;
}): Response {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (result.setCookie) {
    headers['Set-Cookie'] = result.setCookie;
  }
  return new Response(JSON.stringify(result.body), { status: result.status, headers });
}
