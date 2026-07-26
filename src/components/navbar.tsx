import React from 'react';
import { Search, Box, Key, LayoutGrid, Table, Sparkles, Filter } from 'lucide-react';
import { SearchFilterState } from '../types';

interface NavbarProps {
  filters: SearchFilterState;
  onFilterChange: (updates: Partial<SearchFilterState>) => void;
  onOpenTokenModal: () => void;
  hasToken: boolean;
  currentPage: number;
  currentCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  filters,
  onFilterChange,
  onOpenTokenModal,
  hasToken,
  currentPage,
  currentCount
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0A0A0B]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 ring-1 ring-white/20">
              <Box className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-zinc-100 tracking-tight text-base sm:text-lg">
                  Sketchfab Inspector
                </h1>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded tracking-wider">
                  High Density
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block font-sans">
                Deep Geometry & Metadata Analytics for 3D Artists
              </p>
            </div>
          </div>

          {/* Mobile view toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenTokenModal}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                hasToken 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                  : 'bg-[#111113] border-zinc-800 text-zinc-400'
              }`}
            >
              <Key className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => onFilterChange({ query: e.target.value })}
            placeholder="Search downloadable 3D models (e.g., Mech, Drone, Low Poly, Torii)..."
            className="w-full bg-[#111113] border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner font-sans"
          />
          {filters.query && (
            <button
              onClick={() => onFilterChange({ query: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 px-1.5 py-0.5 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {/* Controls & Mode Switches */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#111113] border border-zinc-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => onFilterChange({ viewMode: 'grid' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.viewMode === 'grid'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => onFilterChange({ viewMode: 'table' })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filters.viewMode === 'table'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Artist Matrix</span>
            </button>
          </div>

          {/* Token Status & Modal Launcher */}
          <button
            onClick={onOpenTokenModal}
            className={`hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              hasToken
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-[#111113] border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
            title="Configure Sketchfab OAuth/API Token"
          >
            <Key className={`w-3.5 h-3.5 ${hasToken ? 'text-emerald-400' : 'text-zinc-400'}`} />
            <span>{hasToken ? 'Token Active' : 'API Token'}</span>
            {hasToken && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
          </button>

          {/* Page & Models Badge */}
          <div className="text-xs text-zinc-400 bg-[#111113] border border-zinc-800 px-3 py-2 rounded-xl flex items-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Page <strong className="text-zinc-200">{currentPage}</strong> ({currentCount} models)</span>
          </div>

        </div>

      </div>
    </header>
  );
};
