'use client';

import { useState, ReactNode } from 'react';

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  confirmStyle?: 'danger' | 'primary';
  onConfirm: (reason?: string) => void | Promise<void>;
  trigger: (open: () => void) => ReactNode;
  /** When true, shows a text field for the admin to explain the action
   * (rejections, deactivations, bans) and — unlike leaving it merely
   * present-but-skippable — actually blocks Confirm until it's filled
   * in. The affected owner/user sees this exact text on their own
   * dashboard/login and in their notification email, so a blank one
   * would leave them with literally nothing to act on. */
  requireReason?: boolean;
  /** Customizes the placeholder/helper text for who actually sees this
   * reason — defaults to the business-owner wording most callers use. */
  reasonAudience?: string;
}

export function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirm',
  confirmStyle = 'primary',
  onConfirm,
  trigger,
  requireReason = false,
  reasonAudience = 'the business owner',
}: ConfirmModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const reasonMissing = requireReason && !reason.trim();

  function close() {
    setIsOpen(false);
    setReason('');
    setShowValidation(false);
  }

  async function handleConfirm() {
    if (reasonMissing) {
      setShowValidation(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await onConfirm(requireReason ? reason.trim() : undefined);
      close();
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
              <>
                <textarea
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (showValidation && e.target.value.trim()) setShowValidation(false);
                  }}
                  placeholder={`Reason (required — shown to ${reasonAudience})`}
                  className={`mt-3 w-full rounded-lg border p-2 text-sm focus:outline-none focus:ring-1 ${
                    showValidation && reasonMissing
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
                  }`}
                  rows={3}
                />
                {showValidation && reasonMissing && (
                  <p className="mt-1 text-xs text-red-600">A reason is required.</p>
                )}
              </>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={close}
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
