'use client';

import type { PaginationMeta } from '@/lib/types';

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Shared footer for every admin table (Businesses, Users, Events) — page
 * size selector + prev/next/first/last, driven entirely by the
 * `pagination` block each list endpoint now returns (see
 * albmap-backend's admin.service.js pageParams/paginationMeta).
 */
export function Pagination({
  meta,
  onPageChange,
  onLimitChange,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  const { page, limit, total, totalPages } = meta;
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 sm:flex-row">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>{total === 0 ? 'No results' : `${rangeStart}–${rangeEnd} of ${total}`}</span>
        <select
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          aria-label="Rows per page"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} / page
            </option>
          ))}
        </select>
      </div>

      {/* "« First"/"‹ Prev"/etc as full words wrap mid-button below `sm` —
          five items is too tight for a ~320px phone screen at this font
          size. Icon-only below `sm`, full labels at `sm` and up (verified
          against a real compiled build at 320/375px — full labels wrapped
          to two lines inside each button; symbols alone don't). */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          aria-label="First page"
        >
          <span className="sm:hidden">«</span>
          <span className="hidden sm:inline">« First</span>
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          aria-label="Previous page"
        >
          <span className="sm:hidden">‹</span>
          <span className="hidden sm:inline">‹ Prev</span>
        </button>
        <span className="whitespace-nowrap px-1 text-xs text-gray-600 sm:px-2">
          Page {totalPages === 0 ? 0 : page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          aria-label="Next page"
        >
          <span className="sm:hidden">›</span>
          <span className="hidden sm:inline">Next ›</span>
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          aria-label="Last page"
        >
          <span className="sm:hidden">»</span>
          <span className="hidden sm:inline">Last »</span>
        </button>
      </div>
    </div>
  );
}
