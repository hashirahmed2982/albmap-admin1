'use client';

import { useEffect, useState, useCallback } from 'react';
import { getContent, updatePrivacyPolicy, updateTermsConditions } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { useToast } from '@/components/ToastProvider';
import { AboutUsEditor } from '@/components/content/AboutUsEditor';
import { SocialLinksEditor } from '@/components/content/SocialLinksEditor';
import { LegalPageEditor } from '@/components/content/LegalPageEditor';
import type { SiteContent } from '@/lib/types';

/**
 * About Us, social links, Privacy Policy, and Terms & Conditions used to
 * be hardcoded independently in both the mobile app and the website —
 * changing a word of any of them meant a developer shipping a new
 * build/deploy on both. This page is the one place that content now
 * lives; both clients read it live via GET /content.
 */
export default function ContentPage() {
  const { showToast } = useToast();
  const [content, setContent] = useState<SiteContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setContent(await getContent());
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to load site content', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Content</h1>
      <p className="mt-1 text-sm text-gray-500">
        About Us, social links, Privacy Policy, and Terms &amp; Conditions — edited here, read live by the mobile app
        and website
      </p>

      {isLoading || !content ? (
        <p className="mt-6 text-sm text-gray-500">Loading…</p>
      ) : (
        <div className="mt-6 space-y-6">
          <AboutUsEditor initial={content.aboutUs} />
          <SocialLinksEditor initial={content.socialLinks} />
          <LegalPageEditor
            label="Privacy Policy"
            initial={content.privacyPolicy}
            onSave={updatePrivacyPolicy}
          />
          <LegalPageEditor
            label="Terms & Conditions"
            initial={content.termsConditions}
            onSave={updateTermsConditions}
          />
        </div>
      )}
    </div>
  );
}
