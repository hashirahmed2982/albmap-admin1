'use client';

import { SUPPORTED_LOCALES, type Locale } from '@/lib/types';

/**
 * Shared language tab strip for the 3 content editors that must save
 * en/de/sq together (About Us, Privacy Policy, Terms & Conditions) — see
 * content.service.js's SUPPORTED_LOCALES. Each editor keeps its own
 * per-locale form state and swaps which one is visible; the save button
 * still submits all 3 in one request regardless of which tab is active.
 */
export function LocaleTabs({
  active,
  onChange,
  incompleteLocales,
}: {
  active: Locale;
  onChange: (locale: Locale) => void;
  /** Locales with a validation problem — shown with a marker so an admin
   * doesn't have to click through all 3 tabs to find which one failed. */
  incompleteLocales?: Locale[];
}) {
  return (
    <div className="flex gap-1 border-b border-gray-200">
      {SUPPORTED_LOCALES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          className={`-mb-px border-b-2 px-3 py-1.5 text-xs font-medium ${
            active === code
              ? 'border-red-600 text-red-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {label}
          {incompleteLocales?.includes(code) && <span className="ml-1 text-red-500">•</span>}
        </button>
      ))}
    </div>
  );
}
