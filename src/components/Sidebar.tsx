'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/businesses', label: 'Businesses', icon: '🏪' },
  { href: '/users', label: 'Users', icon: '👤' },
  { href: '/events', label: 'Events', icon: '📅' },
  { href: '/notifications', label: 'Notifications', icon: '🔔' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

/**
 * Below the `md` breakpoint this becomes a slide-in drawer rather than a
 * permanent column — `isOpen`/`onClose` control it there. Above `md`, it's
 * always visible and those props have no effect (the drawer transform and
 * backdrop are both disabled via `md:` variants). Previously this was a
 * fixed w-64 column with no mobile handling at all, which on a phone-width
 * screen left barely more room than the sidebar itself for actual content.
 */
export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <>
      {/* Backdrop — mobile only, only rendered while open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-gray-200 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">AlbMap</p>
            <p className="text-xs text-gray-500">Admin Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-red-50 text-red-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <p className="truncate text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="truncate text-xs text-gray-500">{user?.email}</p>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}