import { LuCalendarX, LuInfo } from "react-icons/lu";
import { DayNotice, TERM } from "@/lib/calendar";

export function DataNotice() {
  return (
    <p className="flex gap-2.5 rounded-xl bg-fill/70 px-3.5 py-3 text-[13px] leading-snug text-label-2">
      <LuInfo className="mt-px size-4 shrink-0" />
      <span>
        RU Open only knows the {TERM.label} class schedule. It can&apos;t see
        events, meetings or other room reservations, so a room shown as free
        may still be in use. Use your own judgement.
      </span>
    </p>
  );
}

export function DayBanner({ notice }: { notice: DayNotice }) {
  return (
    <div
      role="status"
      className={`flex gap-3 rounded-2xl px-4 py-3.5 ${
        notice.upcoming ? "bg-surface shadow-card" : "bg-partial-dot/15"
      }`}
    >
      <LuCalendarX
        className={`mt-0.5 size-5 shrink-0 ${notice.upcoming ? "text-label-2" : "text-partial"}`}
      />
      <div>
        <p className="text-[15px] font-semibold">{notice.title}</p>
        <p className="mt-0.5 text-[13px] text-label-2">{notice.detail}</p>
      </div>
    </div>
  );
}
