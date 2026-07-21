export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-DEFAULT bg-furrow-100 ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="card p-4">
      <Skeleton className="h-36 w-full" />
      <Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-1/2" />
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-furrow-100 bg-white px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-furrow-100 text-2xl">🌾</div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-soil/50">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="rounded-lg border border-clay/20 bg-clay/5 px-6 py-10 text-center">
      <p className="text-sm text-clay">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-outline mt-4">
          Try again
        </button>
      )}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <button
        className="btn-ghost px-3 py-1.5 text-xs"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      <span className="text-xs text-soil/50">
        Page {page} of {pages}
      </span>
      <button
        className="btn-ghost px-3 py-1.5 text-xs"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </div>
  );
}
