import { createFileRoute } from '@tanstack/react-router';
import { fetchModelMetadata } from '#/lib/sketchfabServerFns';

export const Route = createFileRoute('/api/sketchfab/metadata/$uid')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const { uid } = params;
        const url = new URL(request.url);
        const authHeader = request.headers.get('authorization') || '';
        const tokenQuery = url.searchParams.get('sketchfab_token') || '';
        const token = (authHeader ? authHeader.replace('Bearer ', '') : '') || tokenQuery;

        const res = await fetchModelMetadata({ data: { uid, sketchfabToken: token } });
        const cacheControl = token
          ? 'private, no-store'
          : 'public, max-age=60, s-maxage=3600, stale-while-revalidate=3600';
        return new Response(JSON.stringify(res), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': cacheControl,
          },
        });
      },
    },
  },
});
