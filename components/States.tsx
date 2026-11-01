export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse">
      <div className="mb-3 h-5 w-32 rounded-md bg-fill" />
      <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="border-b border-separator px-4 py-4 last:border-b-0">
            <div className="flex justify-between">
              <div className="h-4 w-24 rounded bg-fill" />
              <div className="h-4 w-32 rounded bg-fill" />
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-fill" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Message({ title, text }: { title: string; text?: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {text && <p className="mt-1 text-[15px] text-label-2">{text}</p>}
    </div>
  );
}
