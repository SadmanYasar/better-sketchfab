import { Hash, Loader2 } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { Button } from '#/components/ui/button';

interface InfiniteScrollFooterProps {
  totalCount: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onReset: () => void;
}

export const Pagination: React.FC<InfiniteScrollFooterProps> = ({
  totalCount,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 shadow-xl">
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
        <Hash className="w-3.5 h-3.5 text-primary shrink-0" />
        <span>
          <strong className="text-foreground font-bold">{totalCount}</strong> models loaded
        </span>
      </div>

      {isFetchingNextPage ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Loading more models...</span>
        </div>
      ) : hasNextPage ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchNextPage()}
          className="h-8 px-3.5 text-xs font-medium gap-1.5 rounded-xl"
        >
          Load More
        </Button>
      ) : totalCount > 0 ? (
        <span className="text-[11px] text-muted-foreground">All models loaded</span>
      ) : null}

      <div ref={sentinelRef} className="h-1 w-full sm:w-0" />
    </div>
  );
};
