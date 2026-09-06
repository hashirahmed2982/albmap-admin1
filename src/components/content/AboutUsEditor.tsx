'use client';

import { useState, FormEvent } from 'react';
import { updateAboutUs } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { LocaleTabs } from '@/components/content/LocaleTabs';
import { SUPPORTED_LOCALES, type AboutContent, type Locale, type LocalizedContent } from '@/lib/types';

const EMPTY: AboutContent = {
  tagline: '',
  missionTitle: '',
  missionBody: '',
  visionTitle: '',
  visionBody: '',
};

const FALLBACK: Record<Locale, AboutContent> = { en: EMPTY, de: EMPTY, sq: EMPTY };

/**
 * Feeds the mobile app's About Us screen and the website's /about page —
 * both fetch GET /content and render whatever's saved here directly, no
 * developer/deploy needed to change a word of it.
 *
 * The backend requires English, German, and Albanian copy together on
 * every save (content.service.js's SUPPORTED_LOCALES) — there's no
 * "just update one language" endpoint — so this edits all 3 at once
 * behind language tabs and submits them in a single PUT.
 */
export function AboutUsEditor({ initial }: { initial: LocalizedContent<AboutContent> | null }) {
  const { showToast } = useToast();
  const [activeLocale, setActiveLocale] = useState<Locale>('en');
  const [form, setForm] = useState<Record<Locale, AboutContent>>(
    initial ? { en: initial.en, de: initial.de, sq: initial.sq } : FALLBACK,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [incompleteLocales, setIncompleteLocales] = useState<Locale[]>([]);

  function set<K extends keyof AboutContent>(locale: Locale, key: K, value: AboutContent[K]) {
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
      const saved = await updateAboutUs({ en: form.en, de: form.de, sq: form.sq });
      setForm({ en: saved.en, de: saved.de, sq: saved.sq });
      showToast('About Us updated');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save About Us');
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500';
  const active = form[activeLocale];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">About Us</h2>
      <p className="mt-0.5 text-xs text-gray-500">
        Shown on the mobile app&apos;s About Us screen and the website&apos;s /about page — English, German, and
        Albanian must all be filled in before saving
      </p>

      <div className="mt-4">
        <LocaleTabs active={activeLocale} onChange={setActiveLocale} incompleteLocales={incompleteLocales} />
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Tagline</label>
          <input
            type="text"
            required
            maxLength={150}
            value={active.tagline}
            onChange={(e) => set(activeLocale, 'tagline', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Mission — heading</label>
            <input
              type="text"
              required
              maxLength={100}
              value={active.missionTitle}
              onChange={(e) => set(activeLocale, 'missionTitle', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Vision — heading</label>
            <input
              type="text"
              required
              maxLength={100}
              value={active.visionTitle}
              onChange={(e) => set(activeLocale, 'visionTitle', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Mission — body</label>
            <textarea
              required
              rows={4}
              maxLength={1000}
              value={active.missionBody}
              onChange={(e) => set(activeLocale, 'missionBody', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Vision — body</label>
            <textarea
              required
              rows={4}
              maxLength={1000}
              value={active.visionBody}
              onChange={(e) => set(activeLocale, 'visionBody', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save About Us (all languages)'}
        </button>
      </form>
    </div>
  );
}
