'use client';

import { useState, FormEvent } from 'react';
import { updateHomeHero } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { LocaleTabs } from '@/components/content/LocaleTabs';
import { SUPPORTED_LOCALES, type HomeHeroContent, type Locale, type LocalizedContent } from '@/lib/types';

const EMPTY: HomeHeroContent = { titlePart1: '', titlePart2: '', subtitle: '' };

const FALLBACK: Record<Locale, HomeHeroContent> = { en: EMPTY, de: EMPTY, sq: EMPTY };

/**
 * Feeds the website homepage's hero section (the big headline + subtitle
 * above the search box) — previously hardcoded per-language in the
 * website's own next-intl message files, which now only serve as a
 * fallback shown before this has ever been saved.
 *
 * Same "all 3 languages required together, one PUT" shape as
 * AboutUsEditor — see content.service.js's SUPPORTED_LOCALES.
 */
export function HomeHeroEditor({ initial }: { initial: LocalizedContent<HomeHeroContent> | null }) {
  const { showToast } = useToast();
  const [activeLocale, setActiveLocale] = useState<Locale>('en');
  const [form, setForm] = useState<Record<Locale, HomeHeroContent>>(
    initial ? { en: initial.en, de: initial.de, sq: initial.sq } : FALLBACK,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incompleteLocales, setIncompleteLocales] = useState<Locale[]>([]);

  function set<K extends keyof HomeHeroContent>(locale: Locale, key: K, value: HomeHeroContent[K]) {
    setForm((prev) => ({ ...prev, [locale]: { ...prev[locale], [key]: value } }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const missing = SUPPORTED_LOCALES.filter(({ code }) =>
      Object.values(form[code]).some((v) => !v.trim()),
    ).map(({ code }) => code);
    if (missing.length > 0) {
      setIncompleteLocales(missing);
      setError('Every field is required in all 3 languages — fill in the marked tab(s) before saving.');
      return;
    }
    setIncompleteLocales([]);

    setIsSaving(true);
    try {
      const saved = await updateHomeHero({ en: form.en, de: form.de, sq: form.sq });
      setForm({ en: saved.en, de: saved.de, sq: saved.sq });
      showToast('Homepage hero updated');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save homepage hero');
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500';
  const active = form[activeLocale];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Homepage hero</h2>
      <p className="mt-0.5 text-xs text-gray-500">
        The headline and subtitle shown at the top of the website&apos;s homepage, above the search box — English,
        German, and Albanian must all be filled in before saving
      </p>

      <div className="mt-4">
        <LocaleTabs active={activeLocale} onChange={setActiveLocale} incompleteLocales={incompleteLocales} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Title — line 1</label>
            <input
              type="text"
              required
              maxLength={100}
              value={active.titlePart1}
              onChange={(e) => set(activeLocale, 'titlePart1', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">
              Title — line 2 <span className="font-normal text-gray-400">(shown in the accent color)</span>
            </label>
            <input
              type="text"
              required
              maxLength={100}
              value={active.titlePart2}
              onChange={(e) => set(activeLocale, 'titlePart2', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Subtitle</label>
          <textarea
            required
            rows={2}
            maxLength={300}
            value={active.subtitle}
            onChange={(e) => set(activeLocale, 'subtitle', e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save homepage hero (all languages)'}
        </button>
      </form>
    </div>
  );
}
