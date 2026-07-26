import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Sparkles, Download, Award, Volume2, Layers, FileText } from 'lucide-react';
import { SearchFilterState } from '../types';

interface FilterBarProps {
  filters: SearchFilterState;
  onFilterChange: (updates: Partial<SearchFilterState>) => void;
  onResetFilters: () => void;
}

const DEFAULT_CATEGORIES = [
  { id: '', label: 'All Categories' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'characters-creatures', label: 'Characters & Creatures' },
  { id: 'cars-vehicles', label: 'Cars & Vehicles' },
  { id: 'science-technology', label: 'Science & Tech' },
  { id: 'cultural-heritage-history', label: 'Cultural Heritage' },
  { id: 'places-travel', label: 'Environments' },
  { id: 'weapons-military', label: 'Weapons & Gear' }
];

const LICENSES = [
  { id: '', label: 'All Licenses' },
  { id: 'by', label: 'CC BY (Attribution)' },
  { id: 'by-sa', label: 'CC BY-SA (ShareAlike)' },
  { id: 'by-nc', label: 'CC BY-NC (NonCommercial)' },
  { id: 'by-nc-sa', label: 'CC BY-NC-SA' },
  { id: 'cc0', label: 'CC0 (Public Domain)' }
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters
}) => {
  const [categories, setCategories] = useState<Array<{ id: string; label: string }>>(DEFAULT_CATEGORIES);

  useEffect(() => {
    let isMounted = true;
    async function fetchCategories() {
      try {
        const res = await fetch('/api/sketchfab/categories');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.results) && data.results.length > 0) {
            const fetched = [
              { id: '', label: 'All Categories' },
              ...data.results.map((cat: any) => ({
                id: cat.slug || cat.uid,
                label: cat.name
              }))
            ];
            if (isMounted) {
              setCategories(fetched);
            }
          }
        }
      } catch (err) {
        // Keep default categories fallback
      }
    }
    fetchCategories();
    return () => { isMounted = false; };
  }, []);

  const hasActiveFilters = 
    filters.category || 
    !filters.downloadableOnly ||
    filters.staffpickedOnly ||
    filters.pbrOnly || 
    filters.animatedOnly || 
    filters.riggedOnly || 
    filters.soundOnly ||
    filters.license ||
    filters.maxFaces !== undefined ||
    filters.minFaces !== undefined;

  return (
    <div className="bg-[#0A0A0B]/90 border-b border-zinc-800/80 px-4 lg:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto space-y-2.5">
        
        {/* Category horizontal scroll bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs scroll-smooth">
          <span className="text-zinc-500 font-medium shrink-0 flex items-center gap-1.5 mr-1 text-[11px] uppercase tracking-wider font-mono">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            Categories:
          </span>
          {categories.map((cat) => {
            const isSelected = filters.category === cat.id;
            return (
              <button
                key={cat.id || 'all-categories'}
                onClick={() => onFilterChange({ category: cat.id })}
                className={`px-3 py-1 rounded-lg font-medium shrink-0 border transition-all text-xs cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-semibold shadow-sm'
                    : 'bg-[#111113] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Technical quick filter pills & sort options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5 text-xs">
          
          {/* Quick Technical & Availability Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-500 font-medium mr-1 hidden sm:inline text-[11px] uppercase tracking-wider font-mono">Filters:</span>

            {/* Downloadable Toggle */}
            <button
              onClick={() => onFilterChange({ downloadableOnly: !filters.downloadableOnly })}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                filters.downloadableOnly
                  ? 'bg-emerald-600/25 border-emerald-500/60 text-emerald-300'
                  : 'bg-[#111113] border-zinc-800 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <Download className="w-3 h-3 text-emerald-400" />
              Downloadable
            </button>

            {/* Staff Picked Filter */}
            <button
              onClick={() => onFilterChange({ staffpickedOnly: !filters.staffpickedOnly })}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                filters.staffpickedOnly
                  ? 'bg-amber-600/25 border-amber-500/60 text-amber-300'
                  : 'bg-[#111113] border-zinc-800 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <Award className="w-3 h-3 text-amber-400" />
              Staff Picked
            </button>

            {/* PBR Filter */}
            <button
              onClick={() => onFilterChange({ pbrOnly: !filters.pbrOnly })}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                filters.pbrOnly
                  ? 'bg-indigo-600/25 border-indigo-500/60 text-indigo-300'
                  : 'bg-[#111113] border-zinc-800 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              PBR Shaders
            </button>

            {/* Animated Filter */}
            <button
              onClick={() => onFilterChange({ animatedOnly: !filters.animatedOnly })}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                filters.animatedOnly
                  ? 'bg-purple-600/25 border-purple-500/60 text-purple-300'
                  : 'bg-[#111113] border-zinc-800 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              Animated
            </button>

            {/* Rigged Filter */}
            <button
              onClick={() => onFilterChange({ riggedOnly: !filters.riggedOnly })}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                filters.riggedOnly
                  ? 'bg-cyan-600/25 border-cyan-500/60 text-cyan-300'
                  : 'bg-[#111113] border-zinc-800 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              Skeletal Rig
            </button>

            {/* Sound Filter */}
            <button
              onClick={() => onFilterChange({ soundOnly: !filters.soundOnly })}
              className={`px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                filters.soundOnly
                  ? 'bg-pink-600/25 border-pink-500/60 text-pink-300'
                  : 'bg-[#111113] border-zinc-800 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              <Volume2 className="w-3 h-3 text-pink-400" />
              Sound / Audio
            </button>

            {/* Polycount Range & Presets */}
            <div className="flex items-center gap-1.5 bg-[#111113] border border-zinc-800/90 rounded-lg px-2 py-0.5">
              <span className="text-[11px] font-mono text-zinc-400">Triangles (△):</span>
              <input
                type="number"
                placeholder="Min"
                value={filters.minFaces ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  onFilterChange({ minFaces: val });
                }}
                className="w-16 bg-[#18181b] border border-zinc-700/80 rounded px-1.5 py-0.5 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
              <span className="text-zinc-600 font-mono">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxFaces ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  onFilterChange({ maxFaces: val });
                }}
                className="w-16 bg-[#18181b] border border-zinc-700/80 rounded px-1.5 py-0.5 text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (filters.maxFaces === 20000 && filters.minFaces === undefined) {
                    onFilterChange({ minFaces: undefined, maxFaces: undefined });
                  } else {
                    onFilterChange({ minFaces: undefined, maxFaces: 20000 });
                  }
                }}
                title="Low Poly (< 20k faces)"
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                  filters.maxFaces === 20000 && filters.minFaces === undefined
                    ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                &lt;20k
              </button>
              <button
                type="button"
                onClick={() => {
                  if (filters.minFaces === 20000 && filters.maxFaces === 100000) {
                    onFilterChange({ minFaces: undefined, maxFaces: undefined });
                  } else {
                    onFilterChange({ minFaces: 20000, maxFaces: 100000 });
                  }
                }}
                title="Mid Poly (20k - 100k faces)"
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                  filters.minFaces === 20000 && filters.maxFaces === 100000
                    ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                20k-100k
              </button>
              <button
                type="button"
                onClick={() => {
                  if (filters.minFaces === 100000 && filters.maxFaces === undefined) {
                    onFilterChange({ minFaces: undefined, maxFaces: undefined });
                  } else {
                    onFilterChange({ minFaces: 100000, maxFaces: undefined });
                  }
                }}
                title="High Poly (> 100k faces)"
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                  filters.minFaces === 100000 && filters.maxFaces === undefined
                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                &gt;100k
              </button>
            </div>

            {/* License Dropdown */}
            <div className="flex items-center gap-1 pl-1">
              <FileText className="w-3.5 h-3.5 text-zinc-500" />
              <select
                value={filters.license || ''}
                onChange={(e) => onFilterChange({ license: e.target.value })}
                className="bg-[#111113] border border-zinc-800 rounded-lg px-2 py-1 text-zinc-300 text-xs focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
              >
                {LICENSES.map((lic) => (
                  <option key={lic.id || 'all-lic'} value={lic.id}>
                    {lic.label}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="text-rose-400 hover:text-rose-300 font-medium px-2 py-1 underline underline-offset-2 text-xs cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Sort Selection */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-medium text-[11px] uppercase tracking-wider font-mono">Sort by:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
              className="bg-[#111113] border border-zinc-800 rounded-lg px-2.5 py-1 text-zinc-300 text-xs focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="relevance">Relevance</option>
              <option value="-faceCount">Polycount: High → Low (△)</option>
              <option value="faceCount">Polycount: Low → High (△)</option>
              <option value="-likeCount">Most Liked ❤️</option>
              <option value="-viewCount">Most Viewed 👁️</option>
              <option value="-publishedAt">Recently Added 🕒</option>
            </select>
          </div>

        </div>

      </div>
    </div>
  );
};
