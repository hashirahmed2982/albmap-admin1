import { ReactNode } from 'react';

type Accent = 'red' | 'emerald' | 'amber' | 'blue' | 'purple' | 'gray';

const ACCENT_STYLES: Record<Accent, { bg: string; icon: string; text: string }> = {
  red: { bg: 'bg-red-50', icon: 'text-red-600', text: 'text-gray-900' },
  emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', text: 'text-gray-900' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', text: 'text-gray-900' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-gray-900' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-gray-900' },
  gray: { bg: 'bg-gray-100', icon: 'text-gray-600', text: 'text-gray-900' },
};

export function StatCard({
  label,
  value,
  icon,
  accent = 'gray',
  trend,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: Accent;
  /** Optional small subtext under the value, e.g. "+3 this month" */
  trend?: string;
}) {
  // Falls back to the gray style if an unrecognized accent slips through —
  // TypeScript's `Accent` type only guards this at compile time; a stale
  // cached file, a copy-paste typo (e.g. "grey" vs "gray"), or plain JS
  // calling this component could still pass an invalid string at runtime,
  // and this component should degrade gracefully rather than crash the
  // whole dashboard over a cosmetic prop.
  const style = ACCENT_STYLES[accent] ?? ACCENT_STYLES.gray;
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.icon}`}>
            {icon}
          </div>
        )}
      </div>
      <p className={`mt-3 text-3xl font-bold tracking-tight ${style.text}`}>{value}</p>
      {trend && <p className="mt-1 text-xs font-medium text-emerald-600">{trend}</p>}
    </div>
  );
}
