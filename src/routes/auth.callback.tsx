import { createFileRoute } from '@tanstack/react-router';
import {
  exchangeSketchfabCode,
  getSketchfabCredentials,
  readCookie,
  SKETCHFAB_STATE_COOKIE,
  verifyOAuthState,
} from '../lib/sketchfabAuth';

export const Route = createFileRoute('/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

        const storedState = readCookie(request.headers.get('cookie'), SKETCHFAB_STATE_COOKIE);

        if (!verifyOAuthState(state, storedState)) {
          return new Response(
            `<!DOCTYPE html>
<html>
  <head><title>Sketchfab Auth Error</title></head>
  <body style="background:#0A0A0B;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
    <h3 style="color:#f87171;">Authorization State Mismatch</h3>
    <p style="color:#a1a1aa;font-size:14px;">The OAuth state parameter did not match. The authorization request may have been tampered with. Please try again.</p>
    <script>setTimeout(() => window.close(), 4000);</script>
  </body>
</html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          );
        }

        if (error) {
          return new Response(
            `<!DOCTYPE html>
<html>
  <head><title>Sketchfab Auth Error</title></head>
  <body style="background:#0A0A0B;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
    <h3 style="color:#f87171;">Authorization Refused or Failed</h3>
    <p style="color:#a1a1aa;font-size:14px;">${errorDescription || error}</p>
    <script>setTimeout(() => window.close(), 3000);</script>
  </body>
</html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          );
        }

        if (!code) {
          return new Response('Missing authorization code', { status: 400 });
        }

        const redirectUri = `${url.origin}/auth/callback`;

        const { clientId, clientSecret } = getSketchfabCredentials();

        if (!clientId || !clientSecret) {
          return new Response(
            `<!DOCTYPE html>
<html>
  <head><title>Sketchfab Auth</title></head>
  <body style="background:#0A0A0B;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
    <h3 style="color:#818cf8;">Sketchfab Authorization Received</h3>
    <p style="color:#a1a1aa;font-size:14px;">Finishing authorization sequence...</p>
    <script>
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_CODE_RECEIVED',
          code: '${code}',
          redirectUri: '${redirectUri}'
        }, '*');
      }
    </script>
  </body>
</html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          );
        }

        try {
          const result = await exchangeSketchfabCode({ code, redirectUri });

          if (result.status !== 200) {
            const errText = JSON.stringify(result.body.error || result.body);
            return new Response(
              `<!DOCTYPE html>
<html>
  <head><title>Token Exchange Failed</title></head>
  <body style="background:#0A0A0B;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
    <h3 style="color:#f87171;">Token Exchange Failed</h3>
    <p style="color:#a1a1aa;font-size:13px;font-family:monospace;">${errText}</p>
    <script>setTimeout(() => window.close(), 4000);</script>
  </body>
</html>`,
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
            );
          }

          const accessToken = result.body.token as string;
          const user = result.body.user ?? null;

          return new Response(
            `<!DOCTYPE html>
<html>
  <head><title>Authentication Successful</title></head>
  <body style="background:#0A0A0B;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
    <h3 style="color:#34d399;">Connected to Sketchfab!</h3>
    <p style="color:#a1a1aa;font-size:14px;">Closing window...</p>
    <script>
      if (window.opener) {
        window.opener.postMessage({
          type: 'OAUTH_AUTH_SUCCESS',
          token: '${accessToken}',
          user: ${JSON.stringify(user || {})},
          authType: 'Bearer'
        }, '*');
        window.close();
      } else {
        window.location.href = '/';
      }
    </script>
  </body>
</html>`,
            {
              headers: {
                'Content-Type': 'text/html; charset=utf-8',
                ...(result.setCookie ? { 'Set-Cookie': result.setCookie } : {}),
              },
            },
          );
        } catch (err: any) {
          return new Response(
            `<!DOCTYPE html>
<html>
  <head><title>Auth Exception</title></head>
  <body style="background:#0A0A0B;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
    <h3 style="color:#f87171;">Authentication Exception</h3>
    <p style="color:#a1a1aa;font-size:14px;">${err.message}</p>
    <script>setTimeout(() => window.close(), 4000);</script>
  </body>
</html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          );
        }
      },
    },
  },
});
