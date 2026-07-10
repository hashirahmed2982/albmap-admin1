'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { StatCard } from '@/components/StatCard';
import type { DashboardStats } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load dashboard'));
  }, []);

  if (error) {
    return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  if (!stats) {
    return <div className="text-sm text-gray-500">Loading dashboard…</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Platform overview at a glance</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Business Users" value={stats.totalUsers} />
        <StatCard label="New This Month" value={stats.newUsersThisMonth} accent="text-emerald-600" />
        <StatCard label="Total Businesses" value={stats.totalBusinesses} />
        <StatCard label="Total Events" value={stats.totalEvents} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending Approval" value={stats.pendingBusinesses} accent="text-amber-600" />
        <StatCard label="Approved" value={stats.approvedBusinesses} accent="text-emerald-600" />
        <StatCard label="Rejected" value={stats.rejectedBusinesses} accent="text-red-600" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Top Categories</h2>
          {stats.topCategories.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">No approved businesses yet</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {stats.topCategories.map((c) => (
                <li key={c.category} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{c.category}</span>
                  <span className="font-medium text-gray-900">{c.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
          {stats.recentActivity.length === 0 ? (
            <p className="mt-3 text-sm text-gray-400">No activity yet</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {stats.recentActivity.map((a) => (
                <li key={a.id} className="text-sm">
                  <span className="font-medium text-gray-900">{a.businessName}</span>{' '}
                  <span className="text-gray-500">
                    was {a.newStatus} · {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
