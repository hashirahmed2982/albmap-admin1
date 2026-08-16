'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Upload, Download, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import {
  getPendingBusinesses,
  getAllBusinesses,
  reviewBusiness,
  setBusinessActive,
  importBusinessesCsv,
  downloadBusinessesCsv,
} from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { parseServerDate, localDateRangeToUtcBounds } from '@/lib/dates';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmModal } from '@/components/ConfirmModal';
import { BusinessDetailModal } from '@/components/BusinessDetailModal';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { Pagination } from '@/components/Pagination';
import { SortableHeader } from '@/components/SortableHeader';
import { TruncatedText } from '@/components/TruncatedText';
import { useToast } from '@/components/ToastProvider';
import type { Business, BusinessImportResult, PaginationMeta, SortOrder } from '@/lib/types';

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
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importResult, setImportResult] = useState<BusinessImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const utcRange = localDateRangeToUtcBounds(dateFrom, dateTo);
      const params = {
        search: search || undefined,
        dateFrom: utcRange.dateFrom,
        dateTo: utcRange.dateTo,
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

  // sortBy/sortOrder above stay '' until the admin actually clicks a
  // column header — that's still what's sent to the API (each tab's own
  // server-side default takes over, unchanged). But leaving the header
  // arrows neutral in that state made the list look completely unsorted
  // even though it always was (oldest-first on Pending, newest-first on
  // All) — these mirror each tab's real default so the arrows shown
  // always match what's actually being returned.
  const effectiveSortBy = sortBy || 'createdAt';
  const effectiveSortOrder: SortOrder = sortBy ? sortOrder : tab === 'pending' ? 'asc' : 'desc';

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

  async function handleToggleActive(id: string, isActive: boolean, reason?: string) {
    try {
      await setBusinessActive(id, isActive, reason);
      showToast(isActive ? 'Business reactivated' : 'Business deactivated');
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update', 'error');
    }
  }

  // Picking a file IS the confirmation here — there's no separate
  // "are you sure" step, since the whole point is a quick bulk import
  // and every imported row lands as 'pending' anyway (nothing goes live
  // without a normal review afterward, same safety net as any other
  // submission — see the backend's importBusinessesFromCsv).
  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file name later
    if (!file) return;

    setIsImporting(true);
    try {
      const result = await importBusinessesCsv(file);
      setImportResult(result);
      if (result.imported > 0) load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to import CSV', 'error');
    } finally {
      setIsImporting(false);
    }
  }

  // Exports every business, not just what's currently loaded/filtered on
  // screen — see admin.service.js's exportBusinessesToCsv, which is
  // deliberately a full unfiltered snapshot.
  async function handleExport() {
    setIsExporting(true);
    try {
      await downloadBusinessesCsv();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to export businesses', 'error');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Businesses</h1>
          <p className="mt-1 text-sm text-gray-500">Review submissions and manage listings</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <Download size={16} /> {isExporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <Upload size={16} /> {isImporting ? 'Importing…' : 'Import CSV'}
          </button>
        </div>
      </div>

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
                    activeSortBy={effectiveSortBy}
                    activeSortOrder={effectiveSortOrder}
                    onSort={handleSort}
                    defaultOrder="asc"
                  />
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Owner</th>
                  <SortableHeader
                    label="Submitted"
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
                {businesses.map((b) => (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <TruncatedText text={b.name} maxWidth={180} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.category}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <TruncatedText text={b.formattedAddress} maxWidth={220} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div><TruncatedText text={b.ownerName ?? '—'} maxWidth={140} /></div>
                      {b.ownerEmail && (
                        <div className="text-xs text-gray-400">
                          <TruncatedText text={b.ownerEmail} maxWidth={160} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {b.createdAt ? parseServerDate(b.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={b.status} />
                        {/* isActive only ever applies to an approved listing — pending/
                            rejected ones were never live to begin with, so a separate
                            "inactive" badge there would be redundant noise. Without this,
                            a deactivated business looked IDENTICAL to a normal live one
                            in this table (both just showed the green "approved" badge). */}
                        {b.status === 'approved' && b.isActive === false && (
                          <StatusBadge status="inactive" />
                        )}
                        {b.status === 'pending' && b.ownerAccountStatus === 'invited' && (
                          <StatusBadge status="invited" />
                        )}
                      </div>
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
                            {/* A CSV-imported business's owner account has
                                no password until they click their invite
                                email's link — approving before that would
                                make a listing live under an account nobody
                                has actually proven they control yet. The
                                backend enforces this too (reviewBusiness()
                                rejects the request regardless), this is
                                just what stops the admin from finding out
                                only after clicking. */}
                            <button
                              onClick={() => handleApprove(b.id)}
                              disabled={b.ownerAccountStatus === 'invited'}
                              title={
                                b.ownerAccountStatus === 'invited'
                                  ? `Waiting on ${b.ownerEmail ?? 'the owner'} to set their password via their invite email`
                                  : undefined
                              }
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:bg-gray-300"
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
                        {/* Branches on isActive, not just status — status stays
                            'approved' across a deactivate/reactivate cycle (only
                            is_active changes), so checking status alone meant this
                            always rendered "Deactivate," even on an already-
                            deactivated business, with no way to ever click
                            "Reactivate" again. */}
                        {b.status === 'approved' && b.isActive !== false && (
                          <ConfirmModal
                            title="Deactivate this business?"
                            description={`"${b.name}" will be hidden from the public map until reactivated.`}
                            confirmLabel="Deactivate"
                            confirmStyle="danger"
                            requireReason
                            reasonAudience="the business owner"
                            onConfirm={(reason) => handleToggleActive(b.id, false, reason)}
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
                        {b.status === 'approved' && b.isActive === false && (
                          <ConfirmModal
                            title="Reactivate this business?"
                            description={`"${b.name}" will become visible on the public map again.`}
                            confirmLabel="Reactivate"
                            confirmStyle="primary"
                            onConfirm={() => handleToggleActive(b.id, true)}
                            trigger={(open) => (
                              <button
                                onClick={open}
                                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                              >
                                Reactivate
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

      {importResult && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm"
          onClick={() => setImportResult(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <h3 className="text-lg font-semibold text-gray-900">Import results</h3>
              <button
                onClick={() => setImportResult(null)}
                className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-5">
              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-medium">{importResult.imported} business(es) imported</p>
                  <p className="mt-0.5 text-emerald-700">
                    {importResult.linkedToExistingUser} linked to an existing account,{' '}
                    {importResult.invitedNewUser} new account(s) invited by email. Every imported
                    business is pending review — a CSV-invited owner also needs to activate their
                    account before it can be approved.
                  </p>
                </div>
              </div>

              {importResult.duplicatesSkipped.length > 0 && (
                <div className="mt-4 rounded-xl bg-gray-50 p-3.5 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">
                    {importResult.duplicatesSkipped.length} row(s) skipped — already imported
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Same owner email, business name, and address as a business already on file.
                  </p>
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                    {importResult.duplicatesSkipped.map((d) => (
                      <li key={d.row} className="text-xs text-gray-500">
                        Row {d.row}
                        {d.name && ` (${d.name})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {importResult.failed.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    {importResult.failed.length} row(s) couldn&apos;t be imported
                  </div>
                  <ul className="mt-2 max-h-52 space-y-1.5 overflow-y-auto rounded-xl border border-gray-100 p-3">
                    {importResult.failed.map((f) => (
                      <li key={f.row} className="text-xs text-gray-600">
                        <span className="font-medium text-gray-900">Row {f.row}</span>
                        {f.name && <span className="text-gray-500"> ({f.name})</span>}
                        {' — '}
                        {f.reason}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-gray-400">
                    Fix these rows in the file and re-upload it — rows already imported
                    successfully are safely skipped as duplicates, not imported twice.
                  </p>
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setImportResult(null)}
                className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
