import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/auth/sketchfab/exchange')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as any;
        const { code, clientId, clientSecret, redirectUri } = body;

        const cId = clientId || process.env.SKETCHFAB_CLIENT_ID;
        const cSecret = clientSecret || process.env.SKETCHFAB_CLIENT_SECRET;

        if (!cId || !cSecret || !code) {
          return new Response(
            JSON.stringify({ error: 'Code, client_id, and client_secret are required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
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
              client_id: cId,
              client_secret: cSecret,
              redirect_uri: redirectUri,
            }).toString(),
          });

          if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            return new Response(
              JSON.stringify({ error: 'Token exchange failed', details: errText }),
              { status: tokenRes.status, headers: { 'Content-Type': 'application/json' } },
            );
          }

          const tokenData = await tokenRes.json();
          const accessToken = tokenData.access_token;

          const userRes = await fetch('https://api.sketchfab.com/v3/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          const user = userRes.ok ? await userRes.json() : null;

          return new Response(
            JSON.stringify({
              success: true,
              token: accessToken,
              user,
              authType: 'Bearer',
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Set-Cookie': `sketchfab_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${30 * 24 * 60 * 60}`,
              },
            },
          );
        } catch (err: any) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      },
    },
  },
});
