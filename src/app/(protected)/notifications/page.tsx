'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getPendingBroadcasts,
  getAllBroadcasts,
  reviewBroadcast,
} from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { parseServerDate } from '@/lib/dates';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast } from '@/components/ToastProvider';
import type { BroadcastNotification } from '@/lib/types';

type Tab = 'pending' | 'all';

export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [notifications, setNotifications] = useState<BroadcastNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data =
        tab === 'pending'
          ? await getPendingBroadcasts()
          : await getAllBroadcasts(statusFilter || undefined);
      setNotifications(data);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to load notifications', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [tab, statusFilter, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(id: string) {
    try {
      const result = await reviewBroadcast(id, 'approved');
      showToast(
        result.delivery.delivered
          ? 'Notification approved and sent to every user'
          : `Approved, but delivery didn't go through: ${result.delivery.reason ?? 'unknown reason'}`,
        result.delivery.delivered ? 'success' : 'error',
      );
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to approve', 'error');
    }
  }

  async function handleReject(id: string, reason?: string) {
    try {
      await reviewBroadcast(id, 'rejected', reason);
      showToast('Notification rejected');
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to reject', 'error');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
      <p className="mt-1 text-sm text-gray-500">
        Review broadcasts before they reach every registered user — approving sends it immediately, nothing
        goes out until you do.
      </p>

      <div className="mt-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'pending' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 text-sm font-medium ${
            tab === 'all' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Notifications
        </button>
      </div>

      {tab === 'all' && (
        <div className="mt-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            No notifications found
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-gray-900">{n.title}</h3>
                    <StatusBadge status={n.status} />
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{n.body}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span>
                      Business: <span className="font-medium text-gray-700">{n.businessName ?? '—'}</span>
                    </span>
                    <span>
                      Sent by:{' '}
                      <span className="font-medium text-gray-700">
                        {n.senderName ?? '—'} {n.senderEmail ? `(${n.senderEmail})` : ''}
                      </span>
                    </span>
                    <span>Submitted: {parseServerDate(n.createdAt).toLocaleString()}</span>
                    {n.reviewedAt && (
                      <span>
                        Reviewed by {n.reviewedByName ?? '—'} at {parseServerDate(n.reviewedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {n.status === 'rejected' && n.rejectionReason && (
                    <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      Rejection reason: {n.rejectionReason}
                    </div>
                  )}
                </div>

                {n.status === 'pending' && (
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => handleApprove(n.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      Approve &amp; send
                    </button>
                    <ConfirmModal
                      title="Reject this notification?"
                      description={`"${n.title}" will never be sent to anyone. Optionally explain why — this is shown to the business owner.`}
                      confirmLabel="Reject"
                      confirmStyle="danger"
                      requireReason
                      onConfirm={(reason) => handleReject(n.id, reason)}
                      trigger={(open) => (
                        <button
                          onClick={open}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Reject
                        </button>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
