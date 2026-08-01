import { createFileRoute } from '@tanstack/react-router';
import { exchangeSketchfabCode, responseFromResult } from '../lib/sketchfabAuth';

export const Route = createFileRoute('/api/auth/sketchfab/exchange')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as Record<string, any>;
        const { code, clientId, clientSecret, redirectUri } = body;

        const result = await exchangeSketchfabCode({
          code,
          clientId,
          clientSecret,
          redirectUri,
        });

        return responseFromResult(result);
      },
    },
  },
});
