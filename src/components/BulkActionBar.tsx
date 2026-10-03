'use client';

import { ReactNode } from 'react';

interface BulkActionBarProps {
  count: number;
  onClear: () => void;
  children: ReactNode;
}

/** Sits directly above a table's <thead> once at least one row is
 * selected — hidden entirely otherwise, so it never takes up space on a
 * table nobody is bulk-acting on. */
export function BulkActionBar({ count, onClear, children }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-red-50 px-4 py-2.5">
      <span className="text-sm font-medium text-gray-900">{count} selected</span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      <button
        onClick={onClear}
        className="ml-auto shrink-0 text-xs font-medium text-gray-500 hover:text-gray-700"
      >
        Clear selection
      </button>
    </div>
  );
}
