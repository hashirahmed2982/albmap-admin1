'use client';

import { useState, ReactNode } from 'react';
import {
  X,
  CalendarDays,
  Tag,
  Store,
  Clock,
  User,
  Mail,
  Hash,
  CalendarPlus,
  CalendarClock,
  ImageOff,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { BusinessEvent } from '@/lib/types';
import { parseServerDate } from '@/lib/dates';
import { resolveMediaUrl } from '@/lib/media';

function Field({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-gray-900">
          {value || <span className="font-normal text-gray-400">Not provided</span>}
        </p>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof CalendarDays;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-red-600" />
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-600">{title}</h4>
      </div>
      {children}
    </div>
  );
}

export function EventDetailModal({
  event,
  trigger,
}: {
  event: BusinessEvent;
  trigger: (open: () => void) => ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {trigger(() => setIsOpen(true))}
      {isOpen && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-panel flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-red-50">
                  <CalendarDays className="h-6 w-6 text-red-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-gray-900">{event.name}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={event.isActive === false ? 'inactive' : 'active'} />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto px-6 py-5">
              <div className="space-y-4">
                {event.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveMediaUrl(event.imageUrl) ?? undefined}
                    alt={event.name}
                    className="h-44 w-full rounded-xl border border-gray-100 object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/60 text-gray-400">
                    <ImageOff className="h-4 w-4" />
                    <span className="text-xs font-medium">No image provided</span>
                  </div>
                )}

                {event.description && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Description</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {event.description}
                    </p>
                  </div>
                )}

                <Section icon={Clock} title="Schedule">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                    <Field icon={Tag} label="Category" value={event.category} />
                    <Field icon={Store} label="Business" value={event.businessName} />
                    <Field icon={Clock} label="Starts" value={parseServerDate(event.startTime).toLocaleString()} />
                    <Field icon={Clock} label="Ends" value={parseServerDate(event.endTime).toLocaleString()} />
                  </div>
                </Section>

                <Section icon={User} title="Business owner">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                    <Field icon={User} label="Name" value={event.ownerName} />
                    <Field icon={Mail} label="Email" value={event.ownerEmail} />
                    <Field
                      icon={Hash}
                      label="Business ID"
                      value={<span className="font-mono text-xs font-normal text-gray-600">{event.businessId}</span>}
                    />
                  </div>
                </Section>

                <Section icon={CalendarClock} title="History">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                    <Field
                      icon={CalendarPlus}
                      label="Created"
                      value={event.createdAt ? parseServerDate(event.createdAt).toLocaleString() : null}
                    />
                    <Field
                      icon={CalendarClock}
                      label="Last updated"
                      value={event.updatedAt ? parseServerDate(event.updatedAt).toLocaleString() : null}
                    />
                  </div>
                </Section>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
