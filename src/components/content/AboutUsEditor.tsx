'use client';

import { useState, FormEvent } from 'react';
import { updateAboutUs } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import type { AboutContent } from '@/lib/types';

const FALLBACK: AboutContent = {
  tagline: '',
  missionTitle: '',
  missionBody: '',
  visionTitle: '',
  visionBody: '',
};

/**
 * Feeds the mobile app's About Us screen and the website's /about page —
 * both fetch GET /content and render whatever's saved here directly, no
 * developer/deploy needed to change a word of it.
 */
export function AboutUsEditor({ initial }: { initial: AboutContent | null }) {
  const { showToast } = useToast();
  const [form, setForm] = useState<AboutContent>(initial ?? FALLBACK);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof AboutContent>(key: K, value: AboutContent[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const saved = await updateAboutUs({
        tagline: form.tagline,
        missionTitle: form.missionTitle,
        missionBody: form.missionBody,
        visionTitle: form.visionTitle,
        visionBody: form.visionBody,
      });
      setForm(saved);
      showToast('About Us updated');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save About Us');
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">About Us</h2>
      <p className="mt-0.5 text-xs text-gray-500">
        Shown on the mobile app&apos;s About Us screen and the website&apos;s /about page
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Tagline</label>
          <input
            type="text"
            required
            maxLength={150}
            value={form.tagline}
            onChange={(e) => set('tagline', e.target.value)}
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
              value={form.missionTitle}
              onChange={(e) => set('missionTitle', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Vision — heading</label>
            <input
              type="text"
              required
              maxLength={100}
              value={form.visionTitle}
              onChange={(e) => set('visionTitle', e.target.value)}
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
              value={form.missionBody}
              onChange={(e) => set('missionBody', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-700">Vision — body</label>
            <textarea
              required
              rows={4}
              maxLength={1000}
              value={form.visionBody}
              onChange={(e) => set('visionBody', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save About Us'}
        </button>
      </form>
    </div>
  );
}
