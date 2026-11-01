interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  label?: string;
}

export default function Segmented<T extends string>({
  value,
  onChange,
  options,
  className = "",
  label,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`flex rounded-[10px] bg-fill p-0.5 ${className}`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 whitespace-nowrap rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-all ${
              active
                ? "bg-segment text-label shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                : "text-label-2 hover:text-label"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
