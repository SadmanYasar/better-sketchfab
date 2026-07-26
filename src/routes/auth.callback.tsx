import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/auth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');

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
        const clientId = process.env.SKETCHFAB_CLIENT_ID;
        const clientSecret = process.env.SKETCHFAB_CLIENT_SECRET;

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
          const tokenRes = await fetch('https://sketchfab.com/oauth2/token/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
            }).toString(),
          });

          if (!tokenRes.ok) {
            const errText = await tokenRes.text();
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

          const tokenData = await tokenRes.json();
          const accessToken = tokenData.access_token;

          let user = null;
          if (accessToken) {
            const userRes = await fetch('https://api.sketchfab.com/v3/me', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (userRes.ok) {
              user = await userRes.json();
            }
          }

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
                'Set-Cookie': `sketchfab_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${30 * 24 * 60 * 60}`,
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
