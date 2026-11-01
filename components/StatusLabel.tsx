import { Availability } from "@/lib/when";

const STYLES = {
  free: { text: "text-ok", dot: "bg-ok-dot" },
  partial: { text: "text-partial", dot: "bg-partial-dot" },
  busy: { text: "text-label-2", dot: "bg-busy-dot" },
};

export default function StatusLabel({
  status,
  className = "",
}: {
  status: Availability;
  className?: string;
}) {
  const style = STYLES[status.kind];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[13px] ${style.text} ${className}`}
    >
      <span className={`size-2 shrink-0 rounded-full ${style.dot}`} />
      {status.text}
    </span>
  );
}
