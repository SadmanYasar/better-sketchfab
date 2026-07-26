import React from 'react';
import { ChevronLeft, ChevronRight, Hash } from 'lucide-react';

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
    <div className="bg-[#111113] border border-zinc-800/80 rounded-2xl p-4 sm:p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 shadow-xl">
      {/* Item Range Info */}
      <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
        <Hash className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>
          Showing models <strong className="text-zinc-200 font-bold">{startItem}</strong> -{' '}
          <strong className="text-zinc-200 font-bold">{endItem}</strong> on{' '}
          <strong className="text-indigo-300 font-bold">Page {currentPage}</strong>
        </span>
      </div>

      {/* Page Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevPage}
          disabled={!hasPrevPage || loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-900 disabled:hover:text-zinc-300 disabled:hover:border-zinc-800 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold font-mono text-indigo-300">
          Page {currentPage}
        </div>

        <button
          onClick={onNextPage}
          disabled={!hasNextPage || loading}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:hover:bg-zinc-900 disabled:hover:text-zinc-300 disabled:hover:border-zinc-800 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
