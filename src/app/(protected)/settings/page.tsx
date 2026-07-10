'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-500">Account and system configuration</p>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Signed in as</h2>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-sm font-semibold text-red-700">
            {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-sm font-semibold text-amber-900">Not yet implemented</h2>
        <p className="mt-2 text-sm text-amber-800">
          The following require new backend endpoints that don&apos;t exist yet in
          albmap-backend — this page is an honest placeholder, not a bug:
        </p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-amber-800">
          <li>Managing additional admin accounts (currently one seeded admin only)</li>
          <li>Email notification configuration</li>
          <li>System-wide parameters (e.g. default search radius, category list editing)</li>
        </ul>
        <p className="mt-3 text-sm text-amber-800">
          To add these: create an <code className="rounded bg-amber-100 px-1">/admin/settings</code> module
          in the backend (routes/controller/service, same pattern as the existing admin module),
          then wire the corresponding API calls here.
        </p>
      </div>
    </div>
  );
}
