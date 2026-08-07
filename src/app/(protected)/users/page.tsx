'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAllUsers, setUserActive } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { parseServerDate } from '@/lib/dates';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmModal } from '@/components/ConfirmModal';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { Pagination } from '@/components/Pagination';
import { useToast } from '@/components/ToastProvider';
import type { ManagedUser, PaginationMeta } from '@/lib/types';

const EMPTY_PAGINATION: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAllUsers({
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit,
      });
      setUsers(res.data);
      setPagination(res.pagination);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, dateFrom, dateTo, page, limit, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  // Every filter setter below also resets to page 1 — staying on, say,
  // page 5 of a search that now only has 2 results would just show an
  // empty page instead of the results the admin actually just asked for.
  function handleSearchChange(value: string) {
    setSearch(value);
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

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await setUserActive(id, isActive);
      showToast(isActive ? 'User reactivated' : 'User banned');
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update user', 'error');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
      <p className="mt-1 text-sm text-gray-500">Business accounts registered on the platform</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <DateRangeFilter label="Joined" dateFrom={dateFrom} dateTo={dateTo} onChange={handleDateRangeChange} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{u.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{parseServerDate(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ConfirmModal
                        title={u.isActive ? 'Ban this user?' : 'Reactivate this user?'}
                        description={
                          u.isActive
                            ? `"${u.name}" will lose access to their account and businesses immediately.`
                            : `"${u.name}" will regain access to their account.`
                        }
                        confirmLabel={u.isActive ? 'Ban' : 'Reactivate'}
                        confirmStyle={u.isActive ? 'danger' : 'primary'}
                        onConfirm={() => handleToggleActive(u.id, !u.isActive)}
                        trigger={(open) => (
                          <button
                            onClick={open}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${u.isActive
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                          >
                            {u.isActive ? 'Ban' : 'Reactivate'}
                          </button>
                        )}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!isLoading && users.length > 0 && (
          <Pagination meta={pagination} onPageChange={setPage} onLimitChange={handleLimitChange} />
        )}
      </div>
    </div>
  );
}
