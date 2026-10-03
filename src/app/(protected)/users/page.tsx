'use client';

import { useEffect, useState, useCallback } from 'react';
import { Download, Mail } from 'lucide-react';
import { getAllUsers, setUserActive, deleteUser, resendUserInvite, downloadUsersCsv } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { parseServerDate, localDateRangeToUtcBounds } from '@/lib/dates';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmModal } from '@/components/ConfirmModal';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { Pagination } from '@/components/Pagination';
import { SortableHeader } from '@/components/SortableHeader';
import { TruncatedText } from '@/components/TruncatedText';
import { Checkbox } from '@/components/Checkbox';
import { BulkActionBar } from '@/components/BulkActionBar';
import { useToast } from '@/components/ToastProvider';
import { useRowSelection } from '@/hooks/useRowSelection';
import { runBulk, summarizeBulkResult } from '@/lib/bulk';
import type { ManagedUser, PaginationMeta, SortOrder } from '@/lib/types';

const EMPTY_PAGINATION: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

export default function UsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  // Empty sortBy means "no explicit sort" — the backend falls back to
  // its own default (createdAt desc), same ordering as before sorting
  // existed, until the admin actually clicks a column header.
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();
  const { selected, toggle, toggleAll, clear } = useRowSelection();

  const load = useCallback(async () => {
    setIsLoading(true);
    // A reload always invalidates whatever was selected — new page, new
    // filter, or the result of the bulk action that just ran — so a
    // leftover selected id never silently applies to a row the admin
    // can no longer even see.
    clear();
    try {
      const utcRange = localDateRangeToUtcBounds(dateFrom, dateTo);
      const res = await getAllUsers({
        status: statusFilter || undefined,
        search: search || undefined,
        dateFrom: utcRange.dateFrom,
        dateTo: utcRange.dateTo,
        page,
        limit,
        sortBy: sortBy || undefined,
        sortOrder: sortBy ? sortOrder : undefined,
      });
      setUsers(res.data);
      setPagination(res.pagination);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search, dateFrom, dateTo, page, limit, sortBy, sortOrder, showToast, clear]);

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

  // See businesses/page.tsx's identical comment — mirrors the real
  // server-side default (createdAt desc) so the header arrows never look
  // neutral/unsorted before an explicit column click.
  const effectiveSortBy = sortBy || 'createdAt';
  const effectiveSortOrder: SortOrder = sortBy ? sortOrder : 'desc';

  async function handleToggleActive(id: string, isActive: boolean, reason?: string) {
    try {
      await setUserActive(id, isActive, reason);
      showToast(isActive ? 'User reactivated' : 'User banned');
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update user', 'error');
    }
  }

  async function handleDeleteUser(id: string) {
    try {
      await deleteUser(id);
      showToast('User and all their data permanently deleted');
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to delete user', 'error');
    }
  }

  async function handleResendInvite(id: string, email: string) {
    try {
      await resendUserInvite(id);
      showToast(`Invite email re-sent to ${email}`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to resend invite', 'error');
    }
  }

  const selectedUsers = users.filter((u) => selected.has(u.id));

  async function handleBulkInvite() {
    const targets = selectedUsers.filter((u) => u.accountStatus === 'invited');
    const result = await runBulk(targets.map((u) => u.id), (id) => resendUserInvite(id));
    showToast(summarizeBulkResult('invite(s) re-sent', result, selected.size - targets.length));
    clear();
  }

  async function handleBulkBan(reason: string) {
    const targets = selectedUsers.filter((u) => u.isActive);
    const result = await runBulk(targets.map((u) => u.id), (id) => setUserActive(id, false, reason));
    showToast(summarizeBulkResult('banned', result, selected.size - targets.length));
    load();
  }

  async function handleBulkReactivate() {
    const targets = selectedUsers.filter((u) => !u.isActive);
    const result = await runBulk(targets.map((u) => u.id), (id) => setUserActive(id, true));
    showToast(summarizeBulkResult('reactivated', result, selected.size - targets.length));
    load();
  }

  async function handleBulkDelete() {
    const ids = Array.from(selected);
    const result = await runBulk(ids, (id) => deleteUser(id));
    showToast(summarizeBulkResult('permanently deleted', result));
    load();
  }

  // Exports every business user, not just what's currently loaded/filtered
  // on screen — see admin.service.js's exportUsersToCsv, which is
  // deliberately a full unfiltered snapshot.
  async function handleExport() {
    setIsExporting(true);
    try {
      await downloadUsersCsv();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to export users', 'error');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">Business accounts registered on the platform</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <Download size={16} /> {isExporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Banned</option>
          <option value="invited">Invited</option>
        </select>
        <DateRangeFilter label="Joined" dateFrom={dateFrom} dateTo={dateTo} onChange={handleDateRangeChange} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No users found</div>
        ) : (
          <>
            <BulkActionBar count={selected.size} onClear={clear}>
              {selectedUsers.some((u) => u.isActive) && (
                <ConfirmModal
                  title={`Ban ${selectedUsers.filter((u) => u.isActive).length} selected user(s)?`}
                  description="They'll lose access to their accounts and businesses immediately. The same reason is shown to all of them (at their next login attempt, and emailed)."
                  confirmLabel="Ban selected"
                  confirmStyle="danger"
                  requireReason
                  reasonAudience="the user (shown at their next login attempt, and emailed)"
                  onConfirm={(reason) => handleBulkBan(reason ?? '')}
                  trigger={(open) => (
                    <button
                      onClick={open}
                      className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                    >
                      Ban selected
                    </button>
                  )}
                />
              )}
              {selectedUsers.some((u) => !u.isActive) && (
                <button
                  onClick={handleBulkReactivate}
                  className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  Reactivate selected
                </button>
              )}
              {selectedUsers.some((u) => u.accountStatus === 'invited') && (
                <button
                  onClick={handleBulkInvite}
                  className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Mail size={13} /> Invite selected
                </button>
              )}
              <ConfirmModal
                title={`Permanently delete ${selected.size} selected user(s)?`}
                description="This deletes every selected account and ALL of their data — businesses, events, reviews, favorites — permanently. This cannot be undone."
                confirmLabel="Delete permanently"
                confirmStyle="danger"
                requireTypedConfirmation="DELETE"
                onConfirm={handleBulkDelete}
                trigger={(open) => (
                  <button
                    onClick={open}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Delete selected
                  </button>
                )}
              />
            </BulkActionBar>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Checkbox
                      checked={users.length > 0 && users.every((u) => selected.has(u.id))}
                      indeterminate={users.some((u) => selected.has(u.id)) && !users.every((u) => selected.has(u.id))}
                      onChange={() => toggleAll(users.map((u) => u.id))}
                      aria-label="Select all on this page"
                    />
                  </th>
                  <SortableHeader
                    label="Name"
                    sortKey="name"
                    activeSortBy={effectiveSortBy}
                    activeSortOrder={effectiveSortOrder}
                    onSort={handleSort}
                    defaultOrder="asc"
                  />
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <SortableHeader
                    label="Joined"
                    sortKey="createdAt"
                    activeSortBy={effectiveSortBy}
                    activeSortOrder={effectiveSortOrder}
                    onSort={handleSort}
                    defaultOrder="desc"
                  />
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <Checkbox checked={selected.has(u.id)} onChange={() => toggle(u.id)} aria-label={`Select ${u.name}`} />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <TruncatedText text={u.name} maxWidth={160} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <TruncatedText text={u.email} maxWidth={200} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{parseServerDate(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={u.isActive ? 'active' : 'inactive'} />
                        {u.accountStatus === 'invited' && <StatusBadge status="invited" />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <ConfirmModal
                          title={u.isActive ? 'Ban this user?' : 'Reactivate this user?'}
                          description={
                            u.isActive
                              ? `"${u.name}" will lose access to their account and businesses immediately.`
                              : `"${u.name}" will regain access to their account.`
                          }
                          confirmLabel={u.isActive ? 'Ban' : 'Reactivate'}
                          confirmStyle={u.isActive ? 'danger' : 'primary'}
                          requireReason={u.isActive}
                          reasonAudience="the user (shown at their next login attempt, and emailed)"
                          onConfirm={(reason) => handleToggleActive(u.id, !u.isActive, reason)}
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
                        {u.accountStatus === 'invited' && (
                          <button
                            onClick={() => handleResendInvite(u.id, u.email)}
                            title={`Re-send the invite email to ${u.email}`}
                            className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            <Mail size={13} /> Invite
                          </button>
                        )}
                        <ConfirmModal
                          title="Permanently delete this user?"
                          description={`This deletes "${u.name}" (${u.email}) and ALL of their data — businesses, events, reviews, favorites — permanently. This cannot be undone.`}
                          confirmLabel="Delete permanently"
                          confirmStyle="danger"
                          requireTypedConfirmation="DELETE"
                          onConfirm={() => handleDeleteUser(u.id)}
                          trigger={(open) => (
                            <button
                              onClick={open}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                            >
                              Delete
                            </button>
                          )}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
        {!isLoading && users.length > 0 && (
          <Pagination meta={pagination} onPageChange={setPage} onLimitChange={handleLimitChange} />
        )}
      </div>
    </div>
  );
}
