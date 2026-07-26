import { createFileRoute } from '@tanstack/react-router';
import { fetchSketchfabDownloadUrl } from '#/lib/sketchfabServerFns';

export const Route = createFileRoute('/api/sketchfab/download/$uid')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { uid } = params;
        const url = new URL(request.url);
        const authHeader = request.headers.get('authorization') || '';
        const token =
          (authHeader ? authHeader.replace(/^(Bearer|Token)\s+/i, '') : '') ||
          url.searchParams.get('token') ||
          '';

        const res = await fetchSketchfabDownloadUrl({ data: { uid, token } });
        return new Response(JSON.stringify(res), {
          headers: { 'Content-Type': 'application/json' },
        });
      },
    },
  },
});
