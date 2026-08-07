'use client';

import { useState, FormEvent } from 'react';
import { ApiError } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import type { LegalPageContent } from '@/lib/types';

/**
 * Shared editor for Privacy Policy and Terms & Conditions — both are "a
 * title plus an ordered list of heading/body sections," same shape as
 * the backend's validateLegalPage(), just different content and a
 * different save endpoint. Both clients render `sections` as plain text
 * (newlines preserved) under each heading, so there's no rich-text
 * formatting here — bullet points can be written as separate lines
 * starting with "• " inside a body, same as the seeded Privacy Policy's
 * "Information we collect" section does.
 */
export function LegalPageEditor({
  label,
  initial,
  onSave,
}: {
  label: string;
  initial: LegalPageContent | null;
  onSave: (data: Omit<LegalPageContent, 'updatedAt'>) => Promise<LegalPageContent>;
}) {
  const { showToast } = useToast();
  const [title, setTitle] = useState(initial?.title ?? label);
  const [sections, setSections] = useState(initial?.sections ?? [{ heading: '', body: '' }]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateSection(index: number, field: 'heading' | 'body', value: string) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function addSection() {
    setSections((prev) => [...prev, { heading: '', body: '' }]);
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  function moveSection(index: number, direction: -1 | 1) {
    setSections((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedSections = sections.map((s) => ({ heading: s.heading.trim(), body: s.body.trim() }));
    if (trimmedSections.some((s) => !s.heading || !s.body)) {
      setError('Every section needs both a heading and a body — remove any empty ones first.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await onSave({ title: title.trim(), sections: trimmedSections });
      setTitle(saved.title);
      setSections(saved.sections);
      showToast(`${label} updated`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to save ${label}`);
    } finally {
      setIsSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">{label}</h2>
      <p className="mt-0.5 text-xs text-gray-500">
        Rendered as plain text (line breaks are preserved) on both the mobile app and website — no rich formatting, so
        keep bullet lists as separate lines starting with &ldquo;• &rdquo; inside a section&apos;s body.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-700">Page title</label>
          <input
            type="text"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-3">
          {sections.map((section, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-500">Section {i + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSection(i, -1)}
                    disabled={i === 0}
                    className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-30"
                    aria-label="Move section up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(i, 1)}
                    disabled={i === sections.length - 1}
                    className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 disabled:opacity-30"
                    aria-label="Move section down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(i)}
                    disabled={sections.length === 1}
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
                onChange={(e) => updateSection(i, 'heading', e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
              <textarea
                required
                placeholder="Body text"
                rows={4}
                maxLength={3000}
                value={section.body}
                onChange={(e) => updateSection(i, 'body', e.target.value)}
                className={`mt-2 ${inputClass}`}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addSection}
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
            {isSaving ? 'Saving…' : `Save ${label}`}
          </button>
        </div>
      </form>
    </div>
  );
}
