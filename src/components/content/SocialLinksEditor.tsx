'use client';

import { useState, FormEvent } from 'react';
import { updateSocialLinks } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import type { SocialLinks } from '@/lib/types';

const FALLBACK: SocialLinks = {
  facebook: null,
  instagram: null,
  twitter: null,
  tiktok: null,
  youtube: null,
  linkedin: null,
};

const FIELDS: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
  { key: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/yourhandle' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourhandle' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@yourchannel' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' },
];

/**
 * Feeds the mobile app's About Us social buttons and the website's footer
 * icons. Leaving a field blank hides that icon on both clients — it's
 * never a broken/dead link, just not shown.
 */
export function SocialLinksEditor({ initial }: { initial: SocialLinks | null }) {
  const { showToast } = useToast();
  const [form, setForm] = useState<SocialLinks>(initial ?? FALLBACK);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: keyof SocialLinks, value: string) {
    setForm((prev) => ({ ...prev, [key]: value.trim() === '' ? null : value.trim() }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      const saved = await updateSocialLinks({
        facebook: form.facebook,
        instagram: form.instagram,
        twitter: form.twitter,
        tiktok: form.tiktok,
        youtube: form.youtube,
        linkedin: form.linkedin,
      });
      setForm(saved);
      showToast('Social links updated');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save social links');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Social links</h2>
      <p className="mt-0.5 text-xs text-gray-500">
        Leave a field blank to hide that icon — shown on the mobile app&apos;s About Us screen and the website&apos;s footer
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">{label}</label>
              <input
                type="url"
                placeholder={placeholder}
                maxLength={300}
                value={form[key] ?? ''}
                onChange={(e) => set(key, e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save social links'}
        </button>
      </form>
    </div>
  );
}
