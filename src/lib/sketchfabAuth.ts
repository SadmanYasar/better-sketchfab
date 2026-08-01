const SKETCHFAB_TOKEN_COOKIE = 'sketchfab_token';

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
  const cId = input.clientId || process.env.SKETCHFAB_CLIENT_ID;
  const cSecret = input.clientSecret || process.env.SKETCHFAB_CLIENT_SECRET;

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
  const clientId = input.clientId || (process.env.SKETCHFAB_CLIENT_ID as string) || '';
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

  const state = input.state || Math.random().toString(36).substring(2, 15);
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
