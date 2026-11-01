import { CAMPUSES } from "@/lib/data";

export default function CampusPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Campus"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {CAMPUSES.map((c) => {
        const active = c.slug === value;
        return (
          <button
            key={c.slug}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(c.slug)}
            className={`h-9 shrink-0 rounded-full px-4 text-[14px] font-medium transition-colors ${
              active
                ? "bg-label text-bg"
                : "bg-surface text-label shadow-card hover:bg-fill dark:bg-fill"
            }`}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
