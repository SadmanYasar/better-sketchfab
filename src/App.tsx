import { Box, RefreshCw, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '#/components/ui/button';
import { Skeleton } from '#/components/ui/skeleton';
import { FilterBar } from './components/filter-bar';
import { ModelCard } from './components/model-card';
import { ModelDetailModal } from './components/model-detail-modal';
import { ModelTableView } from './components/model-table-view';
import { Navbar } from './components/navbar';
import { Pagination } from './components/pagination';
import { TokenModal } from './components/token-modal';
import { FEATURED_MODELS } from './data/mockModels';
import type { SearchFilterState, SketchfabModel } from './types';

const PAGE_SIZE = 24;

const extractCursorToken = (cursorVal: string | null | undefined): string | null => {
  if (!cursorVal) return null;
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
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('sketchfab_token') || '';
  });

  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const [filters, setFilters] = useState<SearchFilterState>({
    query: '',
    category: '',
    sortBy: 'relevance',
    downloadableOnly: true,
    staffpickedOnly: false,
    pbrOnly: false,
    animatedOnly: false,
    riggedOnly: false,
    soundOnly: false,
    unsafeSearch: false,
    license: '',
    maxFaces: undefined,
    minFaces: undefined,
    viewMode: 'grid',
  });

  const [bannerDismissed, setBannerDismissed] = useState<boolean>(() => {
    return localStorage.getItem('sketchfab_banner_dismissed') === 'true';
  });

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      localStorage.setItem('sketchfab_banner_dismissed', 'true');
    } catch (_e) {}
  };
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<SketchfabModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<SketchfabModel | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const cursorsRef = useRef<Record<number, string | null>>({ 1: null });
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);

  const handleSaveToken = (newToken: string) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('sketchfab_token', newToken);
    } else {
      localStorage.removeItem('sketchfab_token');
    }
  };

  const handleFilterChange = (updates: Partial<SearchFilterState>) => {
    cursorsRef.current = { 1: null };
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    cursorsRef.current = { 1: null };
    setCurrentPage(1);
    setFilters({
      query: '',
      category: '',
      sortBy: 'relevance',
      downloadableOnly: true,
      staffpickedOnly: false,
      pbrOnly: false,
      animatedOnly: false,
      riggedOnly: false,
      soundOnly: false,
      unsafeSearch: false,
      license: '',
      maxFaces: undefined,
      minFaces: undefined,
      viewMode: filters.viewMode,
    });
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Fetch models from API proxy
  const fetchModels = useCallback(async () => {
    setLoading(true);
    try {
      const activeCursor = cursorsRef.current[currentPage] || null;
      const params = new URLSearchParams({
        count: String(PAGE_SIZE),
        sort_by: filters.sortBy,
      });

      if (filters.query) params.append('q', filters.query);
      if (filters.category) params.append('categories', filters.category);
      if (filters.pbrOnly) params.append('pbr_type', 'pbr');
      if (filters.animatedOnly) params.append('animated', 'true');
      if (filters.riggedOnly) params.append('rigged', 'true');
      if (filters.downloadableOnly) {
        params.append('downloadable', 'true');
      } else {
        params.append('downloadable', '');
      }
      if (filters.staffpickedOnly) params.append('staffpicked', 'true');
      if (filters.soundOnly) params.append('sound', 'true');
      if (filters.license) params.append('licenses', filters.license);
      if (filters.maxFaces !== undefined) params.append('max_face_count', String(filters.maxFaces));
      if (filters.minFaces !== undefined) params.append('min_face_count', String(filters.minFaces));
      if (activeCursor) params.append('cursor', activeCursor);
      if (filters.unsafeSearch) params.append('unsafe_search', 'true');

      const res = await fetch(`/api/sketchfab/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let items: SketchfabModel[] = data.results || [];

        // Apply client-side face count filtering if set
        if (filters.minFaces !== undefined) {
          items = items.filter((m) => m.faceCount >= (filters.minFaces || 0));
        }
        if (filters.maxFaces !== undefined) {
          items = items.filter((m) => m.faceCount <= (filters.maxFaces || 500000));
        }

        // Apply client-side sorting for exact consistency (especially for polycount sorting)
        if (filters.sortBy === '-faceCount') {
          items.sort((a, b) => b.faceCount - a.faceCount);
        } else if (filters.sortBy === 'faceCount') {
          items.sort((a, b) => a.faceCount - b.faceCount);
        } else if (filters.sortBy === '-likeCount') {
          items.sort((a, b) => b.likeCount - a.likeCount);
        } else if (filters.sortBy === '-viewCount') {
          items.sort((a, b) => b.viewCount - a.viewCount);
        } else if (filters.sortBy === '-publishedAt') {
          items.sort(
            (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
          );
        }

        setModels(items);

        const extractedNext = extractCursorToken(data.cursors?.next);
        if (extractedNext) {
          cursorsRef.current[currentPage + 1] = extractedNext;
          setHasNextPage(true);
        } else {
          setHasNextPage(items.length >= PAGE_SIZE);
        }
      } else {
        // Fallback filtering on featured repository
        let items = [...FEATURED_MODELS];
        if (filters.query) {
          const q = filters.query.toLowerCase();
          items = items.filter(
            (m) => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q),
          );
        }
        if (filters.category) {
          items = items.filter((m) => m.categories.some((c) => c.slug === filters.category));
        }
        if (filters.pbrOnly) items = items.filter((m) => m.isPbr);
        if (filters.animatedOnly) items = items.filter((m) => (m.animationCount || 0) > 0);
        if (filters.maxFaces) items = items.filter((m) => m.faceCount <= filters.maxFaces!);

        if (filters.sortBy === '-faceCount') {
          items.sort((a, b) => b.faceCount - a.faceCount);
        } else if (filters.sortBy === 'faceCount') {
          items.sort((a, b) => a.faceCount - b.faceCount);
        } else if (filters.sortBy === '-likeCount') {
          items.sort((a, b) => b.likeCount - a.likeCount);
        } else if (filters.sortBy === '-viewCount') {
          items.sort((a, b) => b.viewCount - a.viewCount);
        } else if (filters.sortBy === '-publishedAt') {
          items.sort(
            (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
          );
        }

        const startIndex = (currentPage - 1) * PAGE_SIZE;
        const pageItems = items.slice(startIndex, startIndex + PAGE_SIZE);
        setModels(pageItems);
        setHasNextPage(startIndex + PAGE_SIZE < items.length);
      }
    } catch (err) {
      console.error('Failed to fetch models:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchModels();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchModels]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      {/* Top Header */}
      <Navbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        hasToken={Boolean(token)}
      />

      {/* Filter and Technical Controls Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
      />

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-5 space-y-5">
        {/* Banner callout for 3D Artists */}
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

        {/* Skeleton Card Loaders */}
        {loading && (
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

        {/* Empty State */}
        {!loading && models.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3 max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-foreground text-sm">No 3D Models Found</h3>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search terms or clearing your category and technical filters.
            </p>
            <Button
              onClick={handleResetFilters}
              variant="default"
              className="rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* Content Views */}
        {!loading && models.length > 0 && (
          <>
            {filters.viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {models.map((model) => (
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

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              currentCount={models.length}
              hasNextPage={hasNextPage}
              hasPrevPage={currentPage > 1}
              onNextPage={handleNextPage}
              onPrevPage={handlePrevPage}
              loading={loading}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-5 px-4 lg:px-8 text-xs text-muted-foreground text-center space-y-1 font-mono">
        <p>
          Built for 3D Artists. Powered by Sketchfab Data API &amp; HTTP Range GLTF Manifest Parser
        </p>
        <p className="text-[11px] text-muted-foreground/80">
          All 3D models belong to their respective creators on Sketchfab.com
        </p>
      </footer>

      {/* Modals */}
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
