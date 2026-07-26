import { ChevronLeft, ChevronRight, Hash } from 'lucide-react';
import type React from 'react';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  currentCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  pageSize,
  currentCount,
  hasNextPage,
  hasPrevPage,
  onNextPage,
  onPrevPage,
  loading = false,
}) => {
  const startItem = currentCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = (currentPage - 1) * pageSize + currentCount;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 shadow-xl">
      {/* Item Range Info */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <Hash className="w-3.5 h-3.5 text-primary shrink-0" />
        <span>
          Showing models <strong className="text-foreground font-bold">{startItem}</strong> -{' '}
          <strong className="text-foreground font-bold">{endItem}</strong> on{' '}
          <strong className="text-primary font-bold">Page {currentPage}</strong>
        </span>
      </div>

      {/* Page Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevPage}
          disabled={!hasPrevPage || loading}
          className="h-8 px-3.5 text-xs font-medium gap-1.5 rounded-xl"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </Button>

        <Badge
          variant="outline"
          className="h-8 px-3 rounded-xl bg-primary/10 border-primary/30 text-xs font-bold font-mono text-primary"
        >
          Page {currentPage}
        </Badge>

        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNextPage || loading}
          className="h-8 px-3.5 text-xs font-medium gap-1.5 rounded-xl"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
