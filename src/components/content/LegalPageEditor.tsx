'use client';

import { useState, FormEvent } from 'react';
import { ApiError } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { LocaleTabs } from '@/components/content/LocaleTabs';
import { SUPPORTED_LOCALES, type LegalPageContent, type Locale, type LocalizedContent } from '@/lib/types';

const EMPTY_PAGE: LegalPageContent = { title: '', sections: [{ heading: '', body: '' }] };

/**
 * Shared editor for Privacy Policy and Terms & Conditions — both are "a
 * title plus an ordered list of heading/body sections in 3 languages,"
 * same shape as the backend's validateLegalPage() run once per locale.
 * Both clients render `sections` as plain text (newlines preserved)
 * under each heading, so there's no rich-text formatting here — bullet
 * points can be written as separate lines starting with "• " inside a
 * body, same as the seeded Privacy Policy's "Information we collect"
 * section does.
 *
 * The backend requires English, German, and Albanian together on every
 * save (content.service.js's SUPPORTED_LOCALES) — there's no "just
 * update one language" endpoint — so this edits all 3 behind language
 * tabs (each with its own independent title/sections, since a
 * translation isn't guaranteed to have the same number of sections) and
 * submits them in a single PUT.
 */
export function LegalPageEditor({
  label,
  initial,
  onSave,
}: {
  label: string;
  initial: LocalizedContent<LegalPageContent> | null;
  onSave: (data: Omit<LocalizedContent<LegalPageContent>, 'updatedAt'>) => Promise<LocalizedContent<LegalPageContent>>;
}) {
  const { showToast } = useToast();
  const [activeLocale, setActiveLocale] = useState<Locale>('en');
  const [pages, setPages] = useState<Record<Locale, LegalPageContent>>(
    initial
      ? { en: initial.en, de: initial.de, sq: initial.sq }
      : { en: { ...EMPTY_PAGE, title: label }, de: { ...EMPTY_PAGE, title: label }, sq: { ...EMPTY_PAGE, title: label } },
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incompleteLocales, setIncompleteLocales] = useState<Locale[]>([]);

  function setTitle(locale: Locale, title: string) {
    setPages((prev) => ({ ...prev, [locale]: { ...prev[locale], title } }));
  }

  function updateSection(locale: Locale, index: number, field: 'heading' | 'body', value: string) {
    setPages((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        sections: prev[locale].sections.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
      },
    }));
  }

  function addSection(locale: Locale) {
    setPages((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], sections: [...prev[locale].sections, { heading: '', body: '' }] },
    }));
  }

  function removeSection(locale: Locale, index: number) {
    setPages((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], sections: prev[locale].sections.filter((_, i) => i !== index) },
    }));
  }

  function moveSection(locale: Locale, index: number, direction: -1 | 1) {
    setPages((prev) => {
      const sections = prev[locale].sections;
      const target = index + direction;
      if (target < 0 || target >= sections.length) return prev;
      const next = [...sections];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, [locale]: { ...prev[locale], sections: next } };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed: Record<Locale, LegalPageContent> = {
      en: pages.en,
      de: pages.de,
      sq: pages.sq,
    };
    for (const { code } of SUPPORTED_LOCALES) {
      trimmed[code] = {
        title: pages[code].title.trim(),
        sections: pages[code].sections.map((s) => ({ heading: s.heading.trim(), body: s.body.trim() })),
      };
    }

    const incomplete = SUPPORTED_LOCALES.filter(
      ({ code }) => !trimmed[code].title || trimmed[code].sections.some((s) => !s.heading || !s.body),
    ).map(({ code }) => code);
    if (incomplete.length > 0) {
      setIncompleteLocales(incomplete);
      setError(
        'Every language needs a title and every section needs both a heading and a body — check the marked tab(s), or remove any empty sections.',
      );
      return;
    }
    setIncompleteLocales([]);

    setIsSaving(true);
    try {
      const saved = await onSave(trimmed);
      setPages({ en: saved.en, de: saved.de, sq: saved.sq });
      showToast(`${label} updated`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to save ${label}`);
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500';
  const page = pages[activeLocale];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">{label}</h2>
      <p className="mt-0.5 text-xs text-gray-500">
        Rendered as plain text (line breaks are preserved) on both the mobile app and website — no rich formatting, so
        keep bullet lists as separate lines starting with &ldquo;• &rdquo; inside a section&apos;s body. English,
        German, and Albanian must all be filled in before saving.
      </p>

      <div className="mt-4">
        <LocaleTabs active={activeLocale} onChange={setActiveLocale} incompleteLocales={incompleteLocales} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Page title</label>
          <input
            type="text"
            required
            maxLength={100}
            value={page.title}
            onChange={(e) => setTitle(activeLocale, e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-3">
          {page.sections.map((section, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-500">Section {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSection(activeLocale, i, -1)}
                    disabled={i === 0}
                    className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-30"
                    aria-label="Move section up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(activeLocale, i, 1)}
                    disabled={i === page.sections.length - 1}
                    className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-30"
                    aria-label="Move section down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(activeLocale, i)}
                    disabled={page.sections.length === 1}
                    className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-30"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <input
                type="text"
                required
                placeholder="Heading (e.g. 1. Acceptance of terms)"
                maxLength={150}
                value={section.heading}
                onChange={(e) => updateSection(activeLocale, i, 'heading', e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
              <textarea
                required
                placeholder="Body text"
                rows={4}
                maxLength={3000}
                value={section.body}
                onChange={(e) => updateSection(activeLocale, i, 'body', e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => addSection(activeLocale)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          + Add section
        </button>

        <div>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving…' : `Save ${label} (all languages)`}
          </button>
        </div>
      </form>
    </div>
  );
}
