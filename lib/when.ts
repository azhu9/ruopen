import {
  ClassBlock,
  DAY_END,
  DAY_NAMES,
  DAY_START,
  dayCodeOf,
  formatDuration,
  formatRange,
  formatTime,
  minutesOf,
} from "./schedule";

// The time a person is looking for a room: right now, or a window on a day.
export type When =
  | { mode: "now" }
  | { mode: "range"; day: string; from: number; to: number };

export const NOW: When = { mode: "now" };
export const WEEKDAYS = ["M", "T", "W", "H", "F"];

const DAY_SLUGS: Record<string, string> = {
  M: "mon",
  T: "tue",
  W: "wed",
  H: "thu",
  F: "fri",
  S: "sat",
  U: "sun",
};

function parseClock(value: string | null) {
  const match = value?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const mins = parseInt(match[1]) * 60 + parseInt(match[2]);
  return mins >= 0 && mins <= 24 * 60 ? mins : null;
}

function clock(mins: number) {
  return `${Math.floor(mins / 60)}:${(mins % 60).toString().padStart(2, "0")}`;
}

export function parseWhen(params: URLSearchParams): When {
  const day = Object.keys(DAY_SLUGS).find(
    (code) => DAY_SLUGS[code] === params.get("day")
  );
  const from = parseClock(params.get("from"));
  const to = parseClock(params.get("to"));
  if (!day || from === null || to === null || to <= from) return NOW;
  return { mode: "range", day, from, to };
}

export function whenParams(when: When): Record<string, string> {
  if (when.mode === "now") return {};
  return { day: DAY_SLUGS[when.day], from: clock(when.from), to: clock(when.to) };
}

// Query string (with leading "?" or empty) that carries the time to another page.
export function whenQuery(when: When) {
  const qs = new URLSearchParams(whenParams(when)).toString();
  return qs ? `?${qs}` : "";
}

export function whenLabel(when: When) {
  if (when.mode === "now") return "Now";
  return `${DAY_NAMES[when.day].short} ${formatRange(when.from, when.to)}`;
}

// The day a schedule should open on for this time.
export function whenDay(when: When, now: Date) {
  return when.mode === "now" ? dayCodeOf(now) : when.day;
}

export function sameWhen(a: When, b: When) {
  if (a.mode === "now" || b.mode === "now") return a.mode === b.mode;
  return a.day === b.day && a.from === b.from && a.to === b.to;
}

export interface Availability {
  kind: "free" | "partial" | "busy";
  text: string;
  // Higher sorts first: minutes of free time around the requested time.
  score: number;
}

function mergedIntervals(blocks: ClassBlock[], day: string) {
  const sorted = blocks
    .filter((b) => b.day === day)
    .map((b) => [b.start, b.end] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of sorted) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  return merged;
}

export function availability(
  blocks: ClassBlock[],
  when: When,
  now: Date
): Availability {
  const day = whenDay(when, now);
  const intervals = mergedIntervals(blocks, day);

  if (when.mode === "now") {
    const t = minutesOf(now);
    const current = intervals.find(([s, e]) => s <= t && t < e);
    if (current) {
      return {
        kind: "busy",
        text: `In use until ${formatTime(current[1])}`,
        score: -(current[1] - t),
      };
    }
    const next = intervals.find(([s]) => s > t);
    if (!next) {
      return {
        kind: "free",
        text: intervals.length ? "Free for the rest of the day" : "Free all day",
        score: 24 * 60,
      };
    }
    return {
      kind: "free",
      text: `Free until ${formatTime(next[0])}`,
      score: next[0] - t,
    };
  }

  const { from, to } = when;
  const overlap = intervals.reduce(
    (sum, [s, e]) => sum + Math.max(0, Math.min(e, to) - Math.max(s, from)),
    0
  );
  const window = to - from;

  if (overlap === 0) {
    if (intervals.length === 0) {
      return { kind: "free", text: "Free all day", score: 24 * 60 };
    }
    const before = intervals.filter(([, e]) => e <= from).pop();
    const after = intervals.find(([s]) => s >= to);
    const start = before ? before[1] : DAY_START;
    const end = after ? after[0] : DAY_END;
    const text = !after
      ? `Free from ${formatTime(start)}`
      : !before
        ? `Free until ${formatTime(end)}`
        : `Free ${formatRange(start, end)}`;
    return { kind: "free", text, score: end - start };
  }

  const freeMins = window - overlap;
  if (freeMins > 0) {
    return {
      kind: "partial",
      text: `Free ${formatDuration(freeMins)} of ${formatDuration(window)}`,
      score: freeMins - window,
    };
  }
  return { kind: "busy", text: "In use the whole time", score: -window };
}

export const KIND_ORDER = { free: 0, partial: 1, busy: 2 };

export function compareAvailability(a: Availability, b: Availability) {
  return KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || b.score - a.score;
}
