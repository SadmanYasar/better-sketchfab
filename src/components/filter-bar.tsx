import { Award, Download, EyeOff, Layers, Plus, RotateCcw, Sparkles, Volume2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { Button } from '#/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '#/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import { Slider } from '#/components/ui/slider';
import type { SearchFilterState } from '../types';

interface FilterBarProps {
  filters: SearchFilterState;
  onFilterChange: (updates: Partial<SearchFilterState>) => void;
  onResetFilters: () => void;
}

const DATE_OPTIONS = [
  { id: '', label: 'All Time' },
  { id: '1', label: 'Last 24 Hours' },
  { id: '7', label: 'Last 7 Days' },
  { id: '31', label: 'Last 30 Days' },
];

const TYPE_OPTIONS = [
  { id: '', label: 'Any' },
  { id: 'ai', label: 'AI Generated' },
  { id: 'human', label: 'Human Created' },
];

const DEFAULT_CATEGORIES = [
  { id: '', label: 'All Categories' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'characters-creatures', label: 'Characters & Creatures' },
  { id: 'cars-vehicles', label: 'Cars & Vehicles' },
  { id: 'science-technology', label: 'Science & Tech' },
  { id: 'cultural-heritage-history', label: 'Cultural Heritage' },
  { id: 'places-travel', label: 'Environments' },
  { id: 'weapons-military', label: 'Weapons & Gear' },
];

const LICENSES = [
  { id: '', label: 'All Licenses' },
  { id: 'by', label: 'CC BY (Attribution)' },
  { id: 'by-sa', label: 'CC BY-SA (ShareAlike)' },
  { id: 'by-nc', label: 'CC BY-NC (NonCommercial)' },
  { id: 'by-nc-sa', label: 'CC BY-NC-SA' },
  { id: 'cc0', label: 'CC0 (Public Domain)' },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  const [categories, setCategories] =
    useState<Array<{ id: string; label: string }>>(DEFAULT_CATEGORIES);

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
                label: cat.name,
              })),
            ];
            if (isMounted) {
              setCategories(fetched);
            }
          }
        }
      } catch (_err) {
        // Keep default categories fallback
      }
    }
    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const hasActiveFilters =
    filters.category ||
    !filters.downloadableOnly ||
    filters.staffpickedOnly ||
    filters.pbrOnly ||
    filters.animatedOnly ||
    filters.riggedOnly ||
    filters.soundOnly ||
    filters.unsafeSearch ||
    filters.license ||
    filters.maxFaces !== undefined ||
    filters.minFaces !== undefined ||
    filters.date ||
    filters.modelType;

  const activeMoreCount = [
    filters.pbrOnly,
    filters.riggedOnly,
    filters.soundOnly,
    filters.unsafeSearch,
    filters.minFaces !== undefined,
    filters.maxFaces !== undefined,
  ].filter(Boolean).length;

  return (
    <div className="bg-background/80 border-b border-border px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        {/* Left: Category, License, Sort */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Select
            value={filters.category || ''}
            onValueChange={(val) => onFilterChange({ category: val || '' })}
          >
            <SelectTrigger className="h-7 min-w-[150px] w-auto bg-background border-border text-xs text-foreground focus:ring-1 focus:ring-ring">
              <SelectValue placeholder="All Categories">
                {categories.find((c) => c.id === filters.category)?.label ?? 'All Categories'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground max-h-[280px]">
              {categories.map((cat) => (
                <SelectItem key={cat.id || 'all-categories'} value={cat.id}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.date || ''}
            onValueChange={(val) => onFilterChange({ date: val || '' })}
          >
            <SelectTrigger className="h-7 min-w-[110px] w-auto bg-background border-border text-xs text-foreground focus:ring-1 focus:ring-ring">
              <SelectValue>
                {DATE_OPTIONS.find((d) => d.id === (filters.date || ''))?.label ?? 'All Time'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground">
              {DATE_OPTIONS.map((opt) => (
                <SelectItem key={opt.id || 'all-time'} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.modelType || ''}
            onValueChange={(val) => onFilterChange({ modelType: val || '' })}
          >
            <SelectTrigger className="h-7 min-w-[120px] w-auto bg-background border-border text-xs text-foreground focus:ring-1 focus:ring-ring">
              <SelectValue>
                {TYPE_OPTIONS.find((t) => t.id === (filters.modelType || ''))?.label ?? 'Any'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground">
              {TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.id || 'any-type'} value={opt.id}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.license || ''}
            onValueChange={(val) => onFilterChange({ license: (val ?? '') as string })}
          >
            <SelectTrigger className="h-7 min-w-[120px] w-auto bg-background border-border text-xs text-foreground focus:ring-1 focus:ring-ring">
              <SelectValue placeholder="License">
                {LICENSES.find((l) => l.id === (filters.license || ''))?.label ?? 'License'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground">
              {LICENSES.map((lic) => (
                <SelectItem key={lic.id || 'all-licenses'} value={lic.id}>
                  {lic.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sortBy || 'relevance'}
            onValueChange={(val) =>
              onFilterChange({ sortBy: (val ?? 'relevance') as SearchFilterState['sortBy'] })
            }
          >
            <SelectTrigger className="h-7 min-w-[140px] w-auto bg-background border-border text-xs text-foreground focus:ring-1 focus:ring-ring">
              <SelectValue>
                {{
                  relevance: 'Relevance',
                  '-likeCount': 'Most Liked',
                  '-viewCount': 'Most Viewed',
                  '-publishedAt': 'Recently Added',
                  '-faceCount': 'Polycount (High-Low)',
                  faceCount: 'Polycount (Low-High)',
                }[filters.sortBy || 'relevance'] ?? 'Relevance'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover border-border text-popover-foreground">
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="-likeCount">Most Liked</SelectItem>
              <SelectItem value="-viewCount">Most Viewed</SelectItem>
              <SelectItem value="-publishedAt">Recently Added</SelectItem>
              <SelectItem value="-faceCount">Polycount (High to Low)</SelectItem>
              <SelectItem value="faceCount">Polycount (Low to High)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right: Toggles + More + Reset */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant={filters.downloadableOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ downloadableOnly: !filters.downloadableOnly })}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-lg border transition-all"
          >
            <Download className="w-3 h-3" />
            <span>Downloadable</span>
          </Button>

          <Button
            variant={filters.staffpickedOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ staffpickedOnly: !filters.staffpickedOnly })}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-lg border transition-all"
          >
            <Award className="w-3 h-3" />
            <span>Staff Picked</span>
          </Button>

          <Button
            variant={filters.animatedOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange({ animatedOnly: !filters.animatedOnly })}
            className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-lg border transition-all"
          >
            <Sparkles className="w-3 h-3" />
            <span>Animated</span>
          </Button>

          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-lg border transition-all"
                >
                  <Plus className="w-3 h-3" />
                  <span>{activeMoreCount > 0 ? `More (${activeMoreCount})` : 'More'}</span>
                </Button>
              }
            />
            <PopoverContent
              className="w-64 bg-popover border-border p-3 text-popover-foreground rounded-xl shadow-2xl"
              align="start"
            >
              <div className="flex flex-col gap-1">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 font-mono">
                  Technical
                </div>

                <Button
                  variant={filters.pbrOnly ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onFilterChange({ pbrOnly: !filters.pbrOnly })}
                  className="h-8 justify-start text-xs font-medium gap-2 px-2 w-full"
                >
                  <span className="w-2 h-2 rounded-full bg-primary-foreground shrink-0" />
                  <span>PBR Shaders</span>
                </Button>

                <Button
                  variant={filters.riggedOnly ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onFilterChange({ riggedOnly: !filters.riggedOnly })}
                  className="h-8 justify-start text-xs font-medium gap-2 px-2 w-full"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Rigged</span>
                </Button>

                <Button
                  variant={filters.soundOnly ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onFilterChange({ soundOnly: !filters.soundOnly })}
                  className="h-8 justify-start text-xs font-medium gap-2 px-2 w-full"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Sound</span>
                </Button>

                <Button
                  variant={filters.unsafeSearch ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onFilterChange({ unsafeSearch: !filters.unsafeSearch })}
                  className={`h-8 justify-start text-xs font-medium gap-2 px-2 w-full ${
                    filters.unsafeSearch
                      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      : ''
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Show Restricted</span>
                </Button>

                <div className="border-t border-border my-2" />

                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 font-mono">
                  Polycount
                </div>

                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {filters.minFaces ? `${(filters.minFaces / 1000).toFixed(0)}k` : '1'}
                  </span>
                  <span className="text-[10px] font-mono text-primary font-bold">
                    {filters.minFaces ? `${(filters.minFaces / 1000).toFixed(0)}k` : '1'} -{' '}
                    {filters.maxFaces ? `${(filters.maxFaces / 1000).toFixed(0)}k` : '500k+'}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {filters.maxFaces ? `${(filters.maxFaces / 1000).toFixed(0)}k` : '500k+'}
                  </span>
                </div>

                <Slider
                  min={1}
                  max={500000}
                  step={1000}
                  value={[filters.minFaces ?? 1, filters.maxFaces ?? 500000]}
                  onValueCommit={([minVal, maxVal]) => {
                    onFilterChange({
                      minFaces: minVal <= 1 ? undefined : minVal,
                      maxFaces: maxVal >= 500000 ? undefined : maxVal,
                    });
                  }}
                  className="w-full"
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mt-1">
                  <span>1</span>
                  <span>150k</span>
                  <span>500k+</span>
                </div>

                <div className="flex items-center gap-1 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onFilterChange({ minFaces: undefined, maxFaces: 10000 })}
                    className="h-6 text-[10px] px-1 flex-1"
                  >
                    Mobile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onFilterChange({ minFaces: undefined, maxFaces: 50000 })}
                    className="h-6 text-[10px] px-1 flex-1"
                  >
                    Indie
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onFilterChange({ minFaces: undefined, maxFaces: undefined })}
                    className="h-6 text-[10px] px-1 flex-1"
                  >
                    Any
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className={`h-7 text-xs px-2 gap-1 transition-opacity ${
              hasActiveFilters
                ? 'text-destructive hover:text-destructive hover:bg-destructive/10 pointer-events-auto opacity-100'
                : 'text-transparent pointer-events-none opacity-0'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
