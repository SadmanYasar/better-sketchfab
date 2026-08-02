import { createFileRoute } from '@tanstack/react-router';
import { verifySketchfabToken } from '#/lib/sketchfabServerFns';

export const Route = createFileRoute('/api/sketchfab/verify-token')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json().catch(() => ({}))) as { token?: string };
        const res = await verifySketchfabToken({ data: { token: body.token || '' } });
        return new Response(JSON.stringify(res), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'private, no-store',
          },
        });
      },
    },
  },
});
