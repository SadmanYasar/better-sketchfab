import { createFileRoute } from '@tanstack/react-router';
import App from '../App';
import { searchSketchfabModels } from '../lib/sketchfabServerFns';
import type { HomeSearch } from '../types';
import { fromHomeSearch } from '../types';

export const Route = createFileRoute('/')({
  validateSearch: (search: Record<string, unknown>): HomeSearch => {
    const result: Record<string, unknown> = {};
    if (search.q) result.q = search.q;
    if (search.category) result.category = search.category;
    if (search.sort && search.sort !== 'relevance') result.sort = search.sort;
    if (search.downloadable === 'false' || search.downloadable === false)
      result.downloadable = false;
    if (search.staffpicked === 'true' || search.staffpicked === true) result.staffpicked = true;
    if (search.pbr === 'true' || search.pbr === true) result.pbr = true;
    if (search.animated === 'true' || search.animated === true) result.animated = true;
    if (search.rigged === 'true' || search.rigged === true) result.rigged = true;
    if (search.sound === 'true' || search.sound === true) result.sound = true;
    if (search.nsfw === 'true' || search.nsfw === true) result.nsfw = true;
    if (search.license) result.license = search.license;
    if (search.minFaces) result.minFaces = Number(search.minFaces);
    if (search.maxFaces) result.maxFaces = Number(search.maxFaces);
    if (search.date) result.date = search.date;
    if (search.type) result.type = search.type;
    if (search.view && search.view !== 'grid') result.view = search.view;
    return result as unknown as HomeSearch;
  },
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }: { deps: HomeSearch }) => {
    const filters = fromHomeSearch(deps);
    const p: Record<string, string> = {
      count: '24',
      sort_by: filters.sortBy,
    };
    if (filters.query) p.q = filters.query;
    if (filters.category) p.categories = filters.category;
    if (filters.pbrOnly) p.pbr_type = 'pbr';
    if (filters.animatedOnly) p.animated = 'true';
    if (filters.riggedOnly) p.rigged = 'true';
    if (filters.staffpickedOnly) p.staffpicked = 'true';
    if (filters.soundOnly) p.sound = 'true';
    if (filters.license) p.licenses = filters.license;
    if (filters.maxFaces !== undefined) p.max_face_count = String(filters.maxFaces);
    if (filters.minFaces !== undefined) p.min_face_count = String(filters.minFaces);
    if (filters.unsafeSearch) p.unsafe_search = 'true';
    if (filters.date) p.date = filters.date;
    if (filters.modelType) p.is_ai = filters.modelType === 'ai' ? 'true' : 'false';
    p.downloadable = filters.downloadableOnly ? 'true' : 'true';

    return searchSketchfabModels({ data: p });
  },
  component: App,
});
