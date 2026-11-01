"use client";

import { useState } from "react";
import { LuChevronDown, LuClock } from "react-icons/lu";
import {
  DAY_END,
  DAY_NAMES,
  DAY_START,
  dayCodeOf,
  formatTime,
  minutesOf,
} from "@/lib/schedule";
import { NOW, WEEKDAYS, When, sameWhen, whenLabel } from "@/lib/when";
import Segmented from "./Segmented";
import Sheet from "./Sheet";

const STEP = 30;
const TIMES = Array.from(
  { length: (DAY_END - DAY_START) / STEP + 1 },
  (_, i) => DAY_START + i * STEP
);

function roundDown(mins: number) {
  return Math.min(Math.max(Math.floor(mins / STEP) * STEP, DAY_START), DAY_END - STEP);
}

function presets(now: Date): { label: string; when: When }[] {
  const today = dayCodeOf(now);
  const day = WEEKDAYS.includes(today) ? today : "M";
  const t = roundDown(minutesOf(now));
  return [
    { label: "Now", when: NOW },
    { label: "Next hour", when: { mode: "range", day, from: t, to: Math.min(t + 60, DAY_END) } },
    { label: "Next 2 hours", when: { mode: "range", day, from: t, to: Math.min(t + 120, DAY_END) } },
    { label: "Afternoon", when: { mode: "range", day, from: 12 * 60, to: 17 * 60 } },
    { label: "Evening", when: { mode: "range", day, from: 17 * 60, to: DAY_END } },
  ];
}

export default function WhenPicker({
  when,
  onChange,
  now,
}: {
  when: When;
  onChange: (when: When) => void;
  now: Date;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<When>(when);

  const openSheet = () => {
    setDraft(when);
    setOpen(true);
  };
  const apply = (next: When) => {
    onChange(next);
    setOpen(false);
  };

  // Editing the day or times turns "Now" into a concrete window.
  const asRange = (w: When) =>
    w.mode === "range" ? w : (presets(now)[1].when as Extract<When, { mode: "range" }>);
  const range = asRange(draft);

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        className="inline-flex h-9 shrink-0 items-center whitespace-nowrap gap-1.5 rounded-full bg-tint-soft px-3.5 text-[14px] font-semibold text-tint transition-opacity hover:opacity-80"
      >
        <LuClock className="size-4" />
        {whenLabel(when)}
        <LuChevronDown className="size-3.5" />
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="When do you need a room?">
        <div className="mt-4 flex flex-wrap gap-2">
          {presets(now).map((p) => {
            const active = sameWhen(p.when, draft);
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => apply(p.when)}
                className={`h-9 rounded-full px-4 text-[14px] font-medium transition-colors ${
                  active ? "bg-tint text-white" : "bg-fill text-label hover:bg-fill/70"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <p className="mt-6 text-[13px] font-medium text-label-2">Or pick a time</p>
        <Segmented
          label="Day"
          value={draft.mode === "range" ? draft.day : ""}
          onChange={(day) => setDraft({ ...range, day })}
          options={WEEKDAYS.map((d) => ({ value: d, label: DAY_NAMES[d].short }))}
          className="mt-2"
        />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <TimeSelect
            label="From"
            value={draft.mode === "range" ? draft.from : null}
            options={TIMES.slice(0, -1)}
            onChange={(from) =>
              setDraft({ ...range, from, to: Math.max(range.to, from + STEP) })
            }
          />
          <TimeSelect
            label="Until"
            value={draft.mode === "range" ? draft.to : null}
            options={TIMES.slice(1)}
            onChange={(to) =>
              setDraft({ ...range, to, from: Math.min(range.from, to - STEP) })
            }
          />
        </div>

        <button
          type="button"
          disabled={draft.mode !== "range"}
          onClick={() => apply(draft)}
          className="mt-6 h-12 w-full rounded-xl bg-tint text-[16px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Show free rooms
        </button>
      </Sheet>
    </>
  );
}

function TimeSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number | null;
  options: number[];
  onChange: (mins: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 rounded-xl bg-fill px-3.5 py-2">
      <span className="text-[12px] font-medium text-label-2">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="-ml-1 bg-transparent text-[17px] font-medium focus:outline-none"
      >
        {value === null && <option value="">Choose</option>}
        {options.map((m) => (
          <option key={m} value={m}>
            {formatTime(m)}
          </option>
        ))}
      </select>
    </label>
  );
}
