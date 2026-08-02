import { createFileRoute } from '@tanstack/react-router';
import { searchSketchfabModels } from '#/lib/sketchfabServerFns';

export const Route = createFileRoute('/api/sketchfab/search')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const queryParams = Object.fromEntries(url.searchParams.entries());
        const res = await searchSketchfabModels({ data: queryParams });
        return new Response(JSON.stringify(res), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=3600',
          },
        });
      },
    },
  },
});
