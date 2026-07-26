'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Store,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { getDashboardStats } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { parseServerDate } from '@/lib/dates';
import { StatCard } from '@/components/StatCard';
import { CategoryBarChart } from '@/components/CategoryBarChart';
import type { DashboardStats } from '@/lib/types';

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - parseServerDate(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const ACTIVITY_STYLES: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  approved: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load dashboard'));
  }, []);

  if (error) {
    return <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  }

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
      </div>
    );
  }

  const approvalRate =
    stats.totalBusinesses > 0 ? Math.round((stats.approvedBusinesses / stats.totalBusinesses) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Platform overview at a glance</p>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 sm:flex">
          <TrendingUp className="h-4 w-4" />
          {approvalRate}% approval rate
        </div>
      </div>

      {/* Primary metrics */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Business Users"
          value={stats.totalUsers}
          icon={<Users className="h-5 w-5" />}
          accent="blue"
          trend={stats.newUsersThisMonth > 0 ? `+${stats.newUsersThisMonth} this month` : undefined}
        />
        <StatCard
          label="Total Businesses"
          value={stats.totalBusinesses}
          icon={<Store className="h-5 w-5" />}
          accent="purple"
        />
        <StatCard
          label="Total Events"
          value={stats.totalEvents}
          icon={<CalendarDays className="h-5 w-5" />}
          accent="gray"
        />
        <StatCard
          label="Pending Review"
          value={stats.pendingBusinesses}
          icon={<Clock className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      {/* Approval breakdown */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Approved"
          value={stats.approvedBusinesses}
          icon={<CheckCircle2 className="h-5 w-5" />}
          accent="emerald"
        />
        <StatCard
          label="Pending"
          value={stats.pendingBusinesses}
          icon={<Clock className="h-5 w-5" />}
          accent="amber"
        />
        <StatCard
          label="Rejected"
          value={stats.rejectedBusinesses}
          icon={<XCircle className="h-5 w-5" />}
          accent="red"
        />
      </div>

      {/* Charts + activity */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">Top Categories</h2>
          <p className="mt-0.5 text-sm text-gray-500">Most common approved business categories</p>
          <div className="mt-5">
            {stats.topCategories.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">No approved businesses yet</p>
            ) : (
              <CategoryBarChart data={stats.topCategories} />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <p className="mt-0.5 text-sm text-gray-500">Latest business approval decisions</p>

          {stats.recentActivity.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No activity yet</p>
          ) : (
            <ul className="mt-5 space-y-1">
              {stats.recentActivity.map((a, i) => {
                const style = ACTIVITY_STYLES[a.newStatus] ?? ACTIVITY_STYLES.pending;
                const Icon = style.icon;
                return (
                  <li key={a.id}>
                    <div className="flex items-start gap-3 py-2.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                        <Icon className={`h-4 w-4 ${style.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-gray-900">
                          <span className="font-medium">{a.businessName}</span>{' '}
                          <span className="text-gray-500">was {a.newStatus}</span>
                        </p>
                        <p className="text-xs text-gray-400">{timeAgo(a.createdAt)}</p>
                      </div>
                    </div>
                    {i < stats.recentActivity.length - 1 && <div className="ml-4 h-1 border-l border-gray-100" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
