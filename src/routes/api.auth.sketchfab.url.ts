import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/auth/sketchfab/url')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const customClientId = url.searchParams.get('client_id');
        const clientId = customClientId || (process.env.SKETCHFAB_CLIENT_ID as string) || '';

        const origin = url.origin;
        const redirectUri = `${origin}/auth/callback`;

        if (!clientId) {
          return new Response(
            JSON.stringify({
              error: 'NO_CLIENT_ID',
              message:
                'Sketchfab OAuth Client ID is missing. Please configure SKETCHFAB_CLIENT_ID in your environment or enter it in the OAuth modal.',
              redirectUri,
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          );
        }

        const state = url.searchParams.get('state') || Math.random().toString(36).substring(2, 15);
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          redirect_uri: redirectUri,
          state,
        });

        const authUrl = `https://sketchfab.com/oauth2/authorize/?${params.toString()}`;

        return new Response(
          JSON.stringify({
            url: authUrl,
            clientId,
            redirectUri,
          }),
          { headers: { 'Content-Type': 'application/json' } },
        );
      },
    },
  },
});
