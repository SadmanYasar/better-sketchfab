import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { ModelCard } from './components/ModelCard';
import { ModelTableView } from './components/ModelTableView';
import { ModelDetailModal } from './components/ModelDetailModal';
import { TokenModal } from './components/TokenModal';
import { Pagination } from './components/Pagination';
import { SearchFilterState, SketchfabModel } from './types';
import { FEATURED_MODELS } from './data/mockModels';
import { Box, RefreshCw, AlertCircle, Sparkles, Layers, SlidersHorizontal, Info } from 'lucide-react';

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
    license: '',
    maxFaces: undefined,
    minFaces: undefined,
    viewMode: 'grid'
  });

  const [models, setModels] = useState<SketchfabModel[]>(FEATURED_MODELS);
  const [loading, setLoading] = useState(false);
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
    setFilters(prev => ({ ...prev, ...updates }));
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
      license: '',
      maxFaces: undefined,
      minFaces: undefined,
      viewMode: filters.viewMode
    });
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
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
        sort_by: filters.sortBy
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

      const res = await fetch(`/api/sketchfab/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let items: SketchfabModel[] = data.results || [];

        // Apply client-side maxFaces filtering if set
        if (filters.maxFaces !== undefined) {
          items = items.filter(m => m.faceCount <= (filters.maxFaces || 20000));
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
          items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
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
          items = items.filter(m => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q));
        }
        if (filters.category) {
          items = items.filter(m => m.categories.some(c => c.slug === filters.category));
        }
        if (filters.pbrOnly) items = items.filter(m => m.isPbr);
        if (filters.animatedOnly) items = items.filter(m => (m.animationCount || 0) > 0);
        if (filters.maxFaces) items = items.filter(m => m.faceCount <= filters.maxFaces!);

        if (filters.sortBy === '-faceCount') {
          items.sort((a, b) => b.faceCount - a.faceCount);
        } else if (filters.sortBy === 'faceCount') {
          items.sort((a, b) => a.faceCount - b.faceCount);
        } else if (filters.sortBy === '-likeCount') {
          items.sort((a, b) => b.likeCount - a.likeCount);
        } else if (filters.sortBy === '-viewCount') {
          items.sort((a, b) => b.viewCount - a.viewCount);
        } else if (filters.sortBy === '-publishedAt') {
          items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
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
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Top Header */}
      <Navbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onOpenTokenModal={() => setIsTokenModalOpen(true)}
        hasToken={Boolean(token)}
        currentPage={currentPage}
        currentCount={models.length}
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
        <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase font-mono">
                Sketchfab Technical Geometry & Shading Inspector
              </h2>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
              Inspect downloadable models with live triangle/vertex counts, PBR shader types, materials, UV layers, vertex colors, animation clips, skeletal rigging, and remote GLTF archive manifest extraction.
            </p>
          </div>

          <button
            onClick={() => setIsTokenModalOpen(true)}
            className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{token ? 'Configure Token' : 'Unlock S3 Manifest Inspector'}</span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-zinc-400 font-medium">Loading Sketchfab 3D Models...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && models.length === 0 && (
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-12 text-center space-y-3 max-w-md mx-auto my-8">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-zinc-200 text-sm">No 3D Models Found</h3>
            <p className="text-xs text-zinc-400">
              Try adjusting your search terms or clearing your category and technical filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-colors"
            >
              Reset Filters
            </button>
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
              <ModelTableView
                models={models}
                onSelectModel={(m) => setSelectedModel(m)}
              />
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
      <footer className="border-t border-zinc-800/80 bg-[#0A0A0B] py-5 px-4 lg:px-8 text-xs text-zinc-500 text-center space-y-1 font-mono">
        <p>Built for 3D Artists • Powered by Sketchfab Data API & HTTP Range GLTF Manifest Parser</p>
        <p className="text-[11px] text-zinc-600">All 3D models belong to their respective creators on Sketchfab.com</p>
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
