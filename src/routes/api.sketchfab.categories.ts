import { createFileRoute } from '@tanstack/react-router';
import { fetchSketchfabCategories } from '#/lib/sketchfabServerFns';

export const Route = createFileRoute('/api/sketchfab/categories')({
  server: {
    handlers: {
      GET: async () => {
        const res = await fetchSketchfabCategories();
        return new Response(JSON.stringify(res), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=60, s-maxage=86400, stale-while-revalidate=3600',
          },
        });
      },
    },
  },
});
