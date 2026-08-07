'use client';

import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import type { SortOrder } from '@/lib/types';

/**
 * A clickable `<th>` for the Businesses/Users/Events tables — name and
 * date columns are sortable server-side (see admin.service.js's
 * resolveSort()), everything else (address, status, actions, ...) stays
 * a plain `<th>`. Clicking the currently-active column flips direction;
 * clicking a different one switches to it at `defaultOrder`.
 */
export function SortableHeader({
  label,
  sortKey,
  activeSortBy,
  activeSortOrder,
  onSort,
  defaultOrder = 'asc',
  className = '',
}: {
  label: string;
  sortKey: string;
  activeSortBy: string;
  activeSortOrder: SortOrder;
  onSort: (sortBy: string, sortOrder: SortOrder) => void;
  /** Direction applied the first time this column is clicked — 'asc' for
   * names (A→Z reads naturally first), 'desc' for dates (most recent/
   * soonest first is usually what you want first). */
  defaultOrder?: SortOrder;
  className?: string;
}) {
  const isActive = activeSortBy === sortKey;

  function handleClick() {
    if (isActive) {
      onSort(sortKey, activeSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSort(sortKey, defaultOrder);
    }
  }

  return (
    <th className={`px-4 py-3 ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`flex items-center gap-1 hover:text-gray-700 ${isActive ? 'text-gray-900' : ''}`}
      >
        {label}
        {isActive ? (
          activeSortOrder === 'asc' ? (
            <ChevronUp size={13} />
          ) : (
            <ChevronDown size={13} />
          )
        ) : (
          <ChevronsUpDown size={13} className="text-gray-300" />
        )}
      </button>
    </th>
  );
}
