import { Box, Key, LayoutGrid, Search, Table } from 'lucide-react';
import type React from 'react';
import { ThemeToggle } from '#/components/theme-toggle';
import { Button } from '#/components/ui/button';
import { Input } from '#/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '#/components/ui/tooltip';
import type { SearchFilterState } from '../types';

interface NavbarProps {
  filters: SearchFilterState;
  onFilterChange: (updates: Partial<SearchFilterState>) => void;
  onOpenTokenModal: () => void;
  hasToken: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  filters,
  onFilterChange,
  onOpenTokenModal,
  hasToken,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md shrink-0">
              <Box className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-foreground tracking-tight text-base sm:text-lg">
                  Better Sketchfab
                </h1>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block font-sans">
                Extended filters and sorts
              </p>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenTokenModal}
              className={`h-9 w-9 border-border ${
                hasToken
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : 'bg-background text-muted-foreground'
              }`}
            >
              <Key className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={filters.query}
            onChange={(e) => onFilterChange({ query: e.target.value })}
            placeholder="Search 3D models (e.g. Mech, Drone, Low Poly)..."
            className="w-full bg-secondary/40 border-border rounded-xl pl-10 pr-14 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary font-sans"
          />
          {filters.query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange({ query: '' })}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 text-[11px] text-muted-foreground hover:text-foreground px-2"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Controls, View Switches & Theme Toggle */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-secondary/40 border border-border rounded-xl p-1 gap-1">
            <Button
              variant={filters.viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onFilterChange({ viewMode: 'grid' })}
              className="h-7 px-3 text-xs gap-1.5 rounded-lg"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </Button>
            <Button
              variant={filters.viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onFilterChange({ viewMode: 'table' })}
              className="h-7 px-3 text-xs gap-1.5 rounded-lg"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Matrix</span>
            </Button>
          </div>

          <ThemeToggle />

          {/* Token Status Modal Launcher */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={hasToken ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={onOpenTokenModal}
                  className="hidden md:flex items-center gap-2 h-9 rounded-xl text-xs font-medium"
                >
                  <Key
                    className={`w-3.5 h-3.5 ${hasToken ? 'text-emerald-500' : 'text-muted-foreground'}`}
                  />
                  <span>{hasToken ? 'Token Active' : 'API Token'}</span>
                  {hasToken && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </Button>
              }
            />
            <TooltipContent>
              <p>Configure Sketchfab OAuth2 or Personal API Key</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
};
