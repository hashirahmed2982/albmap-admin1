'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAllEvents, setEventActive } from '@/lib/admin-api';
import { ApiError } from '@/lib/api';
import { parseServerDate } from '@/lib/dates';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmModal } from '@/components/ConfirmModal';
import { EventDetailModal } from '@/components/EventDetailModal';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { Pagination } from '@/components/Pagination';
import { useToast } from '@/components/ToastProvider';
import type { BusinessEvent, PaginationMeta } from '@/lib/types';

const EMPTY_PAGINATION: PaginationMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

export default function EventsPage() {
  const [events, setEvents] = useState<BusinessEvent[]>([]);
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
      const res = await getAllEvents({
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit,
      });
      setEvents(res.data);
      setPagination(res.pagination);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to load events', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, dateFrom, dateTo, page, limit, showToast]);

  useEffect(() => {
    load();
  }, [load]);

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
      await setEventActive(id, isActive);
      showToast(isActive ? 'Event restored' : 'Event removed');
      load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Failed to update event', 'error');
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
      <p className="mt-1 text-sm text-gray-500">Moderate events across all businesses</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by event or business name…"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-72 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <DateRangeFilter label="Starting" dateFrom={dateFrom} dateTo={dateTo} onChange={handleDateRangeChange} />
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading…</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No events found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Starts</th>
                  <th className="px-4 py-3">Ends</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{e.name}</td>
                    <td className="px-4 py-3 text-gray-600">{e.businessName}</td>
                    <td className="px-4 py-3 text-gray-600">{e.category}</td>
                    <td className="px-4 py-3 text-gray-600">{parseServerDate(e.startTime).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{parseServerDate(e.endTime).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={e.isActive === false ? 'inactive' : 'active'} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <EventDetailModal
                          event={e}
                          trigger={(open) => (
                            <button
                              onClick={open}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              View
                            </button>
                          )}
                        />
                        <ConfirmModal
                          title={e.isActive === false ? 'Restore this event?' : 'Remove this event?'}
                          description={
                            e.isActive === false
                              ? `"${e.name}" will become visible again.`
                              : `"${e.name}" will be hidden from the public events feed.`
                          }
                          confirmLabel={e.isActive === false ? 'Restore' : 'Remove'}
                          confirmStyle={e.isActive === false ? 'primary' : 'danger'}
                          onConfirm={() => handleToggleActive(e.id, e.isActive === false)}
                          trigger={(open) => (
                            <button
                              onClick={open}
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${e.isActive === false
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100'
                                }`}
                            >
                              {e.isActive === false ? 'Restore' : 'Remove'}
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
        )}
        {!isLoading && events.length > 0 && (
          <Pagination meta={pagination} onPageChange={setPage} onLimitChange={handleLimitChange} />
        )}
      </div>
    </div>
  );
}
