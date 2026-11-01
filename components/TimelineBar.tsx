import { ClassBlock, DAY_END, DAY_START } from "@/lib/schedule";

const SPAN = DAY_END - DAY_START;
const pct = (mins: number) =>
  `${(Math.min(Math.max(mins - DAY_START, 0), SPAN) / SPAN) * 100}%`;

// A thin 8 AM – 10 PM strip of one day: busy blocks filled in, the
// requested window outlined, and a marker at the current time.
export default function TimelineBar({
  blocks,
  day,
  window,
  nowMins,
  className = "",
}: {
  blocks: ClassBlock[];
  day: string;
  window?: { from: number; to: number } | null;
  nowMins?: number | null;
  className?: string;
}) {
  const dayBlocks = blocks.filter((b) => b.day === day);
  return (
    <div
      aria-hidden="true"
      className={`relative h-1.5 rounded-full bg-ok-dot/25 ${className}`}
    >
      {dayBlocks.map((b) => (
        <span
          key={b.key}
          className="absolute inset-y-0 rounded-full bg-label-3/80"
          style={{
            left: pct(b.start),
            width: `calc(${pct(b.end)} - ${pct(b.start)})`,
          }}
        />
      ))}
      {window && (
        <span
          className="absolute -inset-y-[3px] rounded-[4px] border-[1.5px] border-tint"
          style={{
            left: pct(window.from),
            width: `calc(${pct(window.to)} - ${pct(window.from)})`,
          }}
        />
      )}
      {nowMins != null && nowMins >= DAY_START && nowMins <= DAY_END && (
        <span
          className="absolute -inset-y-[3px] w-[2px] -translate-x-1/2 rounded-full bg-tint"
          style={{ left: pct(nowMins) }}
        />
      )}
    </div>
  );
}
