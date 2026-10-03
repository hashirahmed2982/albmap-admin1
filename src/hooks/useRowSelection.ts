'use client';

import { useCallback, useState } from 'react';

/**
 * Checkbox-selection state for a paginated admin table. Deliberately
 * tracks only row ids, not full row objects — callers re-derive the
 * actual selected rows from their own current `data` array (via
 * `.filter(row => selected.has(row.id))`) whenever they need them, so a
 * stale selected id can never outlive the row it pointed to.
 */
export function useRowSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Selects every id in `ids` unless they're ALL already selected, in
  // which case it clears just those — the standard "select all on this
  // page" checkbox behavior, toggling based on the page's own state
  // rather than ever touching ids outside `ids`.
  const toggleAll = useCallback((ids: string[]) => {
    setSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  return { selected, toggle, toggleAll, clear };
}
