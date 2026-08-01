import { createFileRoute } from '@tanstack/react-router';
import { buildSketchfabAuthUrl, responseFromResult } from '../lib/sketchfabAuth';

export const Route = createFileRoute('/api/auth/sketchfab/url')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const result = buildSketchfabAuthUrl({
          origin: url.origin,
          clientId: url.searchParams.get('client_id'),
          state: url.searchParams.get('state'),
        });

        return responseFromResult(result);
      },
    },
  },
});
