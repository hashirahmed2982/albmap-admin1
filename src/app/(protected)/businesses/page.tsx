'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getPendingBusinesses,
  getAllBusinesses,
  reviewBusiness,
  setBusinessActive,
} from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { parseServerDate } from '@/lib/dates';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmModal } from '@/components/ConfirmModal';
import { BusinessDetailModal } from '@/components/BusinessDetailModal';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { Pagination } from '@/components/Pagination';
import { SortableHeader } from '@/components/SortableHeader';
import { useToast } from '@/components/ToastProvider';
import type { Business, PaginationMeta, SortOrder } from '@/lib/types';

type Tab = 'pending' | 'all';

const EMPTY_PAGINATION: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

export default function BusinessesPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  // Empty sortBy means "no explicit sort" — each tab keeps its own
  // existing default (Pending: oldest-first; All: newest-first) until
  // the admin actually clicks a column header.
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit,
        sortBy: sortBy || undefined,
        sortOrder: sortBy ? sortOrder : undefined,
      };
      const res =
        tab === 'pending'
          ? await getPendingBusinesses(params)
          : await getAllBusinesses({ ...params, status: statusFilter || undefined });
      setBusinesses(res.data);
      setPagination(res.pagination);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to load businesses', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [tab, statusFilter, search, dateFrom, dateTo, page, limit, sortBy, sortOrder, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  // Every filter/tab change below also resets to page 1 — a different
  // tab or filter has a different result set, so staying on (say) page 5
  // would likely just show an empty page instead of what was just asked
  // for.
  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    setPage(1);
  }
  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }
  function handleStatusFilterChange(value: string) {
    setStatusFilter(value);
    setPage(1);
  }
  function handleDateRangeChange(range: { dateFrom: string; dateTo: string }) {
    setDateFrom(range.dateFrom);
    setDateTo(range.dateTo);
    setPage(1);
  }
  function handleLimitChange(newLimit: number) {
    setLimit(newLimit);
    setPage(1);
  }
  function handleSort(newSortBy: string, newSortOrder: SortOrder) {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  }

  async function handleApprove(id: string) {
    try {
      await reviewBusiness(id, 'approved');
      showToast('Business approved');
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to approve', 'error');
    }
  }

  async function handleReject(id: string, reason?: string) {
    try {
      await reviewBusiness(id, 'rejected', reason);
      showToast('Business rejected');
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to reject', 'error');
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await setBusinessActive(id, isActive);
      showToast(isActive ? 'Business reactivated' : 'Business deactivated');
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update', 'error');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Businesses</h1>
      <p className="mt-1 text-sm text-gray-500">Review submissions and manage listings</p>

      <div className="mt-6 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => handleTabChange('pending')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'pending' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => handleTabChange('all')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'all' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          All Businesses
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        {tab === 'all' && (
          <select
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
        <DateRangeFilter label="Submitted" dateFrom={dateFrom} dateTo={dateTo} onChange={handleDateRangeChange} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : businesses.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No businesses found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <SortableHeader
                    label="Name"
                    sortKey="name"
                    activeSortBy={sortBy}
                    activeSortOrder={sortOrder}
                    onSort={handleSort}
                    defaultOrder="asc"
                  />
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Owner</th>
                  <SortableHeader
                    label="Submitted"
                    sortKey="createdAt"
                    activeSortBy={sortBy}
                    activeSortOrder={sortOrder}
                    onSort={handleSort}
                    defaultOrder="desc"
                  />
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {businesses.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.name}</td>
                    <td className="px-4 py-3 text-gray-600">{b.category}</td>
                    <td className="px-4 py-3 text-gray-600">{b.formattedAddress}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{b.ownerName ?? '—'}</div>
                      {b.ownerEmail && <div className="text-xs text-gray-400">{b.ownerEmail}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {b.createdAt ? parseServerDate(b.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <BusinessDetailModal
                          business={b}
                          trigger={(open) => (
                            <button
                              onClick={open}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              View
                            </button>
                          )}
                        />
                        {b.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(b.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                            >
                              Approve
                            </button>
                            <ConfirmModal
                              title="Reject this business?"
                              description={`"${b.name}" will not appear publicly. Optionally explain why — this is shown to the owner.`}
                              confirmLabel="Reject"
                              confirmStyle="danger"
                              requireReason
                              onConfirm={(reason) => handleReject(b.id, reason)}
                              trigger={(open) => (
                                <button
                                  onClick={open}
                                  className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                                >
                                  Reject
                                </button>
                              )}
                            />
                          </>
                        )}
                        {b.status === 'approved' && (
                          <ConfirmModal
                            title="Deactivate this business?"
                            description={`"${b.name}" will be hidden from the public map until reactivated.`}
                            confirmLabel="Deactivate"
                            confirmStyle="danger"
                            onConfirm={() => handleToggleActive(b.id, false)}
                            trigger={(open) => (
                              <button
                                onClick={open}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Deactivate
                              </button>
                            )}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && businesses.length > 0 && (
          <Pagination meta={pagination} onPageChange={setPage} onLimitChange={handleLimitChange} />
        )}
      </div>
    </div>
  );
}
