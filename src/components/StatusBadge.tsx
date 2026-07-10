const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  rejected: 'bg-red-50 text-red-700 ring-red-600/20',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  inactive: 'bg-gray-100 text-gray-600 ring-gray-500/20',
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.inactive;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset capitalize ${style}`}
    >
      {status}
    </span>
  );
}
