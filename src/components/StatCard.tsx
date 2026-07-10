import { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  icon,
  accent = 'text-gray-900',
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <p className={`mt-2 text-3xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}
