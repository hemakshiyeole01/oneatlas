export function Loading() {
  return (
    <div className="animate-pulse space-y-3" aria-busy="true">
      <div className="h-8 w-1/3 rounded bg-neutral-200" />
      <div className="h-4 w-2/3 rounded bg-neutral-200" />
      <div className="h-48 rounded bg-neutral-200" />
    </div>
  );
}

export function ErrorBox({ message, status }: { message: string; status?: number }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {status === 404 ? "This page does not exist." : message}
    </div>
  );
}

export function OpenBadge({ open }: { open: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        open ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-700"
      }`}
    >
      {open ? "Open" : "Closed"}
    </span>
  );
}