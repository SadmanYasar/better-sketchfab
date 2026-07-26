import { useInfiniteQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Box, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '#/components/ui/button';
import { Skeleton } from '#/components/ui/skeleton';
import { FilterBar } from './components/filter-bar';
import { ModelCard } from './components/model-card';
import { ModelDetailModal } from './components/model-detail-modal';
import { ModelTableView } from './components/model-table-view';
import { Navbar } from './components/navbar';
import { Pagination } from './components/pagination';
import { TokenModal } from './components/token-modal';
import { searchSketchfabModels } from './lib/sketchfabServerFns';
import type { HomeSearch, SketchfabModel } from './types';
import { fromHomeSearch, normalizeSearch, toHomeSearch } from './types';

const PAGE_SIZE = 24;

const extractCursorToken = (cursorVal: string | null | undefined): string | undefined => {
  if (!cursorVal) return undefined;
  if (cursorVal.includes('cursor=')) {
    try {
      const match = cursorVal.match(/cursor=([^&]+)/);
      return match ? decodeURIComponent(match[1]) : cursorVal;
    } catch {
      return cursorVal;
    }
  }
  return cursorVal;
};

export default function App() {
  const search = normalizeSearch(useSearch({ from: '/', structuralSharing: false }));
  const navigate = useNavigate({ from: '/' });

  const [token, setToken] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return localStorage.getItem('sketchfab_token') || '';
    } catch {
      return '';
    }
  });

  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('sketchfab_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem('sketchfab_banner_dismissed', 'true');
    } catch (_e) {}
  };

  const [selectedModel, setSelectedModel] = useState<SketchfabModel | null>(null);

  const filters = useMemo(() => fromHomeSearch(search), [search]);

  const apiParams = useMemo(() => {
    const p: Record<string, string> = {
      count: String(PAGE_SIZE),
      sort_by: filters.sortBy,
    };
    if (filters.query) p.q = filters.query;
    if (filters.category) p.categories = filters.category;
    if (filters.pbrOnly) p.pbr_type = 'true';
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
    return p;
  }, [filters]);

  const { data, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: [
        'search',
        filters.query,
        filters.category,
        filters.sortBy,
        filters.downloadableOnly,
        filters.staffpickedOnly,
        filters.pbrOnly,
        filters.animatedOnly,
        filters.riggedOnly,
        filters.soundOnly,
        filters.unsafeSearch,
        filters.license,
        filters.minFaces,
        filters.maxFaces,
        filters.date,
        filters.modelType,
      ],
      queryFn: async ({ pageParam }) => {
        const params = pageParam ? { ...apiParams, cursor: pageParam } : apiParams;
        return searchSketchfabModels({ data: params });
      },
      initialPageParam: '',
      getNextPageParam: (lastPage) => extractCursorToken(lastPage.cursors?.next),
      staleTime: 30000,
    });

  const models = data?.pages.flatMap((p) => p.results || []) || [];
  const totalLoaded = models.length;
  const isInitialLoading = isLoading;

  const handleSaveToken = (newToken: string) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('sketchfab_token', newToken);
    } else {
      localStorage.removeItem('sketchfab_token');
    }
  };

  const handleFilterChange = (updates: Partial<HomeSearch>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...updates,
      }),
    });
  };

  const handleResetFilters = () => {
    navigate({
      search: (prev) => ({
        ...prev,
        q: '',
        category: '',
        sort: 'relevance',
        staffpicked: false,
        pbr: false,
        animated: false,
        rigged: false,
        sound: false,
        nsfw: false,
        license: '',
        minFaces: undefined as unknown as undefined,
        maxFaces: undefined as unknown as undefined,
        ...(search.view !== 'grid' ? { view: search.view } : {}),
      }),
    });
  };

  const handleFilterChangePartial = (updates: Partial<HomeSearch>) => {
    handleFilterChange(updates);
  };
  const handleResetFiltersPartial = () => {
    handleResetFilters();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      <Navbar
        filters={filters}
        onFilterChange={(u: any) =>
          handleFilterChangePartial(toHomeSearch(u) as Partial<HomeSearch>)
        }
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        hasToken={Boolean(token)}
      />

      <FilterBar
        filters={filters}
        onFilterChange={(u: any) =>
          handleFilterChangePartial(toHomeSearch(u) as Partial<HomeSearch>)
        }
        onResetFilters={handleResetFiltersPartial}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5 space-y-5">
        {!bannerDismissed ? (
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl relative group">
            <div className="space-y-1 pr-6 sm:pr-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <h2 className="text-xs sm:text-sm font-bold text-foreground tracking-wide uppercase font-mono">
                  Sketchfab Technical Geometry &amp; Shading Inspector
                </h2>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
                Inspect downloadable models with live triangle/vertex counts, PBR shader types,
                materials, UV layers, vertex colors, animation clips, skeletal rigging, and remote
                GLTF archive manifest extraction.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <Button
                onClick={() => setIsTokenModalOpen(true)}
                variant="secondary"
                className="text-xs font-semibold shrink-0 gap-1.5 rounded-xl border border-border"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>{token ? 'Configure Token' : 'Unlock S3 Manifest Inspector'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissBanner}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-lg"
                title="Dismiss Banner"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-2">
              <span>Inspector banner hidden.</span>
              <span>
                To configure your API key, click the{' '}
                <button
                  type="button"
                  onClick={() => setIsTokenModalOpen(true)}
                  className="text-primary hover:underline font-semibold cursor-pointer"
                >
                  API Token / Key
                </button>{' '}
                button in the top navigation bar.
              </span>
            </p>
            <button
              type="button"
              onClick={() => {
                setBannerDismissed(false);
                try {
                  localStorage.removeItem('sketchfab_banner_dismissed');
                } catch (_e) {}
              }}
              className="text-[11px] text-muted-foreground hover:text-foreground underline shrink-0 cursor-pointer"
            >
              Show Banner
            </button>
          </div>
        )}

        {isInitialLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={`skeleton-card-${idx}`}
                className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-muted"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 z-10">
                  <Skeleton className="h-4 w-8 rounded-md" />
                  <Skeleton className="h-4 w-6 rounded-md" />
                </div>
                <div className="absolute top-2.5 right-2.5 z-10">
                  <Skeleton className="h-4 w-10 rounded-md" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 z-10 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="h-4 w-12 rounded-md" />
                    <Skeleton className="h-4 w-12 rounded-md" />
                    <Skeleton className="h-4 w-8 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="w-4 h-4 rounded-full" />
                      <Skeleton className="h-3 w-16 rounded-md" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-10 rounded-md" />
                      <Skeleton className="h-3 w-8 rounded-md" />
                      <Skeleton className="h-6 w-14 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isInitialLoading && models.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3 max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-foreground text-sm">No 3D Models Found</h3>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search terms or clearing your category and technical filters.
            </p>
            <Button
              onClick={handleResetFiltersPartial}
              variant="default"
              className="rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </Button>
          </div>
        )}

        {models.length > 0 && (
          <>
            {filters.viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {models.map((model: SketchfabModel) => (
                  <ModelCard
                    key={model.uid}
                    model={model}
                    onSelectModel={(m) => setSelectedModel(m)}
                  />
                ))}
              </div>
            ) : (
              <ModelTableView models={models} onSelectModel={(m) => setSelectedModel(m)} />
            )}

            <Pagination
              totalCount={totalLoaded}
              hasNextPage={!!hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={() => fetchNextPage()}
              onReset={() => {}}
            />
          </>
        )}
      </main>

      <footer className="border-t border-border bg-card py-5 px-4 lg:px-8 text-xs text-muted-foreground text-center space-y-1 font-mono">
        <p>
          Built for 3D Artists. Powered by Sketchfab Data API &amp; HTTP Range GLTF Manifest Parser
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          All 3D models belong to their respective creators on Sketchfab.com
        </p>
      </footer>

      <ModelDetailModal
        model={selectedModel}
        onClose={() => setSelectedModel(null)}
        token={token}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
      />

      <TokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        token={token}
        onSaveToken={handleSaveToken}
      />
    </div>
  );
}
