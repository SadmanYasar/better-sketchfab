import {
  Award,
  Download,
  EyeOff,
  Layers,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Triangle,
  Volume2,
} from 'lucide-react';
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
    filters.minFaces !== undefined;

  return (
    <div className="bg-background/80 border-b border-border px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto space-y-2.5">
        {/* Category horizontal scroll bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs scroll-smooth">
          <span className="text-muted-foreground font-medium shrink-0 flex items-center gap-1.5 mr-1 text-[11px] uppercase tracking-wider font-mono">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            Categories:
          </span>
          {categories.map((cat) => {
            const isSelected = filters.category === cat.id;
            return (
              <Button
                key={cat.id || 'all-categories'}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onFilterChange({ category: cat.id })}
                className="h-7 px-3 text-xs rounded-lg shrink-0 border transition-all"
              >
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Technical quick filter pills & sort options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5 text-xs">
          {/* Quick Technical & Availability Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground font-medium mr-1 hidden sm:inline text-[11px] uppercase tracking-wider font-mono">
              Filters:
            </span>

            {/* Downloadable Toggle */}
            <Button
              variant={filters.downloadableOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ downloadableOnly: !filters.downloadableOnly })}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-lg border transition-all"
            >
              <Download className="w-3 h-3" />
              <span>Downloadable</span>
            </Button>

            {/* Staff Picked Filter */}
            <Button
              variant={filters.staffpickedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ staffpickedOnly: !filters.staffpickedOnly })}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-lg border transition-all"
            >
              <Award className="w-3 h-3" />
              <span>Staff Picked</span>
            </Button>

            {/* PBR Filter */}
            <Button
              variant={filters.pbrOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ pbrOnly: !filters.pbrOnly })}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-lg border transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-primary-foreground" />
              <span>PBR Shaders</span>
            </Button>

            {/* Animated Filter */}
            <Button
              variant={filters.animatedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ animatedOnly: !filters.animatedOnly })}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-lg border transition-all"
            >
              <Sparkles className="w-3 h-3" />
              <span>Animated</span>
            </Button>

            {/* Rigged Filter */}
            <Button
              variant={filters.riggedOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ riggedOnly: !filters.riggedOnly })}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-lg border transition-all"
            >
              <Layers className="w-3 h-3" />
              <span>Rigged</span>
            </Button>

            {/* Sound Filter */}
            <Button
              variant={filters.soundOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ soundOnly: !filters.soundOnly })}
              className="h-7 px-2.5 text-xs font-medium gap-1.5 rounded-lg border transition-all"
            >
              <Volume2 className="w-3 h-3" />
              <span>Sound</span>
            </Button>

            {/* NSFW / Unsafe Search Filter */}
            <Button
              variant={filters.unsafeSearch ? 'default' : 'outline'}
              size="sm"
              onClick={() => onFilterChange({ unsafeSearch: !filters.unsafeSearch })}
              className={`h-7 px-2.5 text-xs font-medium gap-1.5 rounded-lg border transition-all ${
                filters.unsafeSearch
                  ? 'bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90'
                  : 'border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive/10'
              }`}
            >
              <EyeOff className="w-3 h-3" />
              <span>NSFW</span>
            </Button>
          </div>

          {/* Polycount Density Slider, License & Sorting Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Polycount Density Slider Popover */}
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant={
                      filters.minFaces !== undefined || filters.maxFaces !== undefined
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    className="h-7 px-3 min-w-[130px] text-xs font-mono gap-1.5 rounded-lg border transition-all"
                  >
                    <Triangle className="w-3 h-3 fill-current" />
                    <span>
                      {filters.minFaces === undefined && filters.maxFaces === undefined
                        ? 'Polycount: Any'
                        : `${filters.minFaces ? `${(filters.minFaces / 1000).toFixed(0)}k` : '1'} - ${
                            filters.maxFaces ? `${(filters.maxFaces / 1000).toFixed(0)}k` : '500k+'
                          } Polys`}
                    </span>
                  </Button>
                }
              />
              <PopoverContent className="w-72 bg-popover border-border p-4 text-popover-foreground space-y-4 rounded-xl shadow-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground font-mono flex items-center gap-1.5">
                    <Triangle className="w-3 h-3 text-primary fill-primary" /> Polycount Range
                  </span>
                  <span className="text-xs font-mono font-bold text-primary">
                    {filters.minFaces ? `${(filters.minFaces / 1000).toFixed(0)}k` : '1'} -{' '}
                    {filters.maxFaces ? `${(filters.maxFaces / 1000).toFixed(0)}k` : 'Unlimited'}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  <Slider
                    min={1}
                    max={500000}
                    step={1000}
                    value={[filters.minFaces ?? 1, filters.maxFaces ?? 500000]}
                    onValueChange={([minVal, maxVal]) => {
                      onFilterChange({
                        minFaces: minVal <= 1 ? undefined : minVal,
                        maxFaces: maxVal >= 500000 ? undefined : maxVal,
                      });
                    }}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span>1 Poly</span>
                    <span>150k (Game)</span>
                    <span>500k+ (Any)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFilterChange({ minFaces: undefined, maxFaces: 10000 })}
                    className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                  >
                    Mobile (10k)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFilterChange({ minFaces: undefined, maxFaces: 50000 })}
                    className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                  >
                    Indie (50k)
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onFilterChange({ minFaces: undefined, maxFaces: undefined })}
                    className="h-6 text-[10px] px-2 text-destructive hover:text-destructive"
                  >
                    Reset
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* License Selector */}
            <Select
              value={filters.license || ''}
              onValueChange={(val) => onFilterChange({ license: (val ?? '') as string })}
            >
              <SelectTrigger className="h-7 w-[130px] bg-background border-border text-xs text-foreground focus:ring-1 focus:ring-ring">
                <SelectValue placeholder="All Licenses">
                  {LICENSES.find((l) => l.id === (filters.license || ''))?.label ?? 'All Licenses'}
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

            {/* Sorting Selector */}
            <Select
              value={filters.sortBy || 'relevance'}
              onValueChange={(val) =>
                onFilterChange({ sortBy: (val ?? 'relevance') as SearchFilterState['sortBy'] })
              }
            >
              <SelectTrigger className="h-7 w-[150px] bg-background border-border text-xs text-foreground focus:ring-1 focus:ring-ring">
                <SelectValue placeholder="Sort Models">
                  {{
                    relevance: 'Sort: Relevance',
                    '-likeCount': 'Sort: Most Liked',
                    '-viewCount': 'Sort: Most Viewed',
                    '-publishedAt': 'Sort: Recently Added',
                    '-faceCount': 'Sort: Polycount (High→Low)',
                    faceCount: 'Sort: Polycount (Low→High)',
                  }[filters.sortBy || 'relevance'] ?? 'Sort Models'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-popover-foreground">
                <SelectItem value="relevance">Sort: Relevance</SelectItem>
                <SelectItem value="-likeCount">Sort: Most Liked</SelectItem>
                <SelectItem value="-viewCount">Sort: Most Viewed</SelectItem>
                <SelectItem value="-publishedAt">Sort: Recently Added</SelectItem>
                <SelectItem value="-faceCount">Sort: Polycount (High to Low)</SelectItem>
                <SelectItem value="faceCount">Sort: Polycount (Low to High)</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Filters Action - always mounted to prevent layout shift */}
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
    </div>
  );
};
