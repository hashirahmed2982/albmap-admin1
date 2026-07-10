'use client';

import { useState, ReactNode } from 'react';

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  confirmStyle?: 'danger' | 'primary';
  onConfirm: (reason?: string) => void | Promise<void>;
  trigger: (open: () => void) => ReactNode;
  /** When true, shows a text field for the admin to explain the action (used for rejections). */
  requireReason?: boolean;
}

export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirm',
  confirmStyle = 'primary',
  onConfirm,
  trigger,
  requireReason = false,
}: ConfirmModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await onConfirm(requireReason ? reason : undefined);
      setIsOpen(false);
      setReason('');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {trigger(() => setIsOpen(true))}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-600">{description}</p>
            {requireReason && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (shown to the business owner)"
                className="mt-3 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                rows={3}
              />
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting}
                className={`rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                  confirmStyle === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isSubmitting ? 'Working…' : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
