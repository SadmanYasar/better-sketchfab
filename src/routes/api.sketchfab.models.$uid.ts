import { createFileRoute } from '@tanstack/react-router';
import { fetchSketchfabModelDetails } from '#/lib/sketchfabServerFns';

export const Route = createFileRoute('/api/sketchfab/models/$uid')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { uid } = params;
        const res = await fetchSketchfabModelDetails({ data: { uid } });
        return new Response(JSON.stringify(res), {
          headers: { 'Content-Type': 'application/json' },
        });
      },
    },
  },
});
