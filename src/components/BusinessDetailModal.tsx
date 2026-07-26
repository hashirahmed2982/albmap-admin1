'use client';

import { useState, ReactNode } from 'react';
import {
  X,
  Store,
  Phone,
  MapPin,
  Star,
  Tag,
  Clock,
  User,
  Mail,
  Hash,
  CalendarPlus,
  CalendarClock,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { Business } from '@/lib/types';
import { parseServerDate } from '@/lib/dates';
import { resolveMediaUrl } from '@/lib/media';

function Field({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: ReactNode }) {
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
  icon: typeof Store;
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

export function BusinessDetailModal({
  business,
  trigger,
}: {
  business: Business;
  trigger: (open: () => void) => ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hours = business.openingHours || {};
  const hasHours = Object.keys(hours).length > 0;

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
                  {business.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveMediaUrl(business.logoUrl) ?? undefined} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-gray-900">{business.name}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={business.status} />
                    {business.isActive === false && <StatusBadge status="inactive" />}
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
                {business.description && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Description</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                      {business.description}
                    </p>
                  </div>
                )}

                <Section icon={Tag} title="Listing details">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                    <Field icon={Tag} label="Category" value={business.category} />
                    <Field icon={Phone} label="Phone" value={business.phone} />
                    <Field icon={MessageCircle} label="WhatsApp" value={business.whatsappNumber} />
                    <Field icon={MapPin} label="Street address" value={business.streetAddress} />
                    <Field label="City" icon={MapPin} value={business.city} />
                    <Field label="Postal code" icon={MapPin} value={business.postalCode} />
                    <Field label="Country" icon={MapPin} value={business.country} />
                    <Field
                      icon={MapPin}
                      label="Coordinates"
                      value={
                        <a
                          href={`https://www.google.com/maps?q=${business.latitude},${business.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 font-mono text-xs font-normal text-red-600 underline decoration-red-200 underline-offset-2 hover:text-red-700 hover:decoration-red-400"
                        >
                          {business.latitude}, {business.longitude}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      }
                    />
                    <Field
                      icon={Star}
                      label="Rating"
                      value={
                        business.rating != null
                          ? `${business.rating.toFixed(1)} · ${business.ratingCount ?? 0} review${business.ratingCount === 1 ? '' : 's'}`
                          : null
                      }
                    />
                    <Field
                      icon={Hash}
                      label="Tags"
                      value={business.tags?.length ? business.tags.join(', ') : null}
                    />
                  </div>
                </Section>

                <Section icon={Clock} title="Opening hours">
                  {hasHours ? (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
                      {Object.entries(hours).map(([day, range]) => (
                        <div key={day} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 text-sm">
                          <span className="font-medium text-gray-500">{day}</span>
                          <span className="text-gray-900">{range}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Not provided</p>
                  )}
                </Section>

                <Section icon={User} title="Owner">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                    <Field icon={User} label="Name" value={business.ownerName} />
                    <Field icon={Mail} label="Email" value={business.ownerEmail} />
                    <Field icon={Phone} label="Phone" value={business.ownerPhone} />
                    <Field
                      icon={Hash}
                      label="Owner ID"
                      value={<span className="font-mono text-xs font-normal text-gray-600">{business.ownerId}</span>}
                    />
                  </div>
                </Section>

                <Section icon={ShieldCheck} title="Review history">
                  <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
                    <Field
                      icon={CalendarPlus}
                      label="Submitted"
                      value={business.createdAt ? parseServerDate(business.createdAt).toLocaleString() : null}
                    />
                    <Field
                      icon={CalendarClock}
                      label="Last updated"
                      value={business.updatedAt ? parseServerDate(business.updatedAt).toLocaleString() : null}
                    />
                    <Field icon={ShieldCheck} label="Reviewed by" value={business.reviewedByName} />
                    <Field
                      icon={CalendarClock}
                      label="Reviewed at"
                      value={business.reviewedAt ? parseServerDate(business.reviewedAt).toLocaleString() : null}
                    />
                  </div>
                  {business.status === 'rejected' && business.rejectionReason && (
                    <div className="mt-3.5 flex gap-2.5 rounded-lg bg-red-50 p-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-red-500">
                          Rejection reason
                        </p>
                        <p className="mt-0.5 text-sm text-red-800">{business.rejectionReason}</p>
                      </div>
                    </div>
                  )}
                </Section>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
