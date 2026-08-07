'use client';

/**
 * Plain "YYYY-MM-DD" inputs, matching what the backend expects directly
 * (dateFrom/dateTo query params — see admin.service.js) with no client-
 * side date parsing needed. `label` explains which date the range
 * applies to, since that differs per table (Businesses/Users filter by
 * submitted/joined date; Events filters by when it starts, not when the
 * row was created).
 */
export function DateRangeFilter({
  label,
  dateFrom,
  dateTo,
  onChange,
}: {
  label: string;
  dateFrom: string;
  dateTo: string;
  onChange: (range: { dateFrom: string; dateTo: string }) => void;
}) {
  const inputClass =
    'rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <input
        type="date"
        value={dateFrom}
        onChange={(e) => onChange({ dateFrom: e.target.value, dateTo })}
        className={inputClass}
        aria-label={`${label} from`}
      />
      <span className="text-xs text-gray-400">to</span>
      <input
        type="date"
        value={dateTo}
        onChange={(e) => onChange({ dateFrom, dateTo: e.target.value })}
        className={inputClass}
        aria-label={`${label} to`}
      />
      {(dateFrom || dateTo) && (
        <button
          onClick={() => onChange({ dateFrom: '', dateTo: '' })}
          className="text-xs font-medium text-gray-500 underline hover:text-gray-700"
        >
          Clear
        </button>
      )}
    </div>
  );
}
