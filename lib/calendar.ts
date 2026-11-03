import { dayCodeOf } from "./schedule";

// Rutgers–New Brunswick Fall 2026 calendar, from the Registrar:
// https://nbregistrar.rutgers.edu/undergrad/f26ugcal.htm
// Update this each term along with the class data.
export const TERM = {
  label: "Fall 2026",
  firstDay: "2026-09-01",
  lastDay: "2026-12-10",
};

interface Closure {
  from: string;
  to: string;
  label: string;
  detail: string;
}

const CLOSURES: Closure[] = [
  { from: "2026-09-07", to: "2026-09-07", label: "Labor Day", detail: "No classes today." },
  { from: "2026-11-26", to: "2026-11-29", label: "Thanksgiving recess", detail: "No classes Nov 26–29." },
  { from: "2026-12-11", to: "2026-12-11", label: "Reading day", detail: "No classes today." },
  { from: "2026-12-14", to: "2026-12-14", label: "Reading day", detail: "No classes today." },
  {
    from: "2026-12-15",
    to: "2026-12-22",
    label: "Final exams",
    detail: "The class schedule doesn't apply. Rooms may be booked for exams.",
  },
];

// Days when Rutgers runs another weekday's schedule.
const DAY_SWAPS: Record<string, { day: string; label: string }> = {
  "2026-09-08": { day: "M", label: "Monday" },
  "2026-11-25": { day: "F", label: "Friday" },
};

// The day code for "no classes meet", which matches no class blocks.
export const NO_CLASSES = "X";

export function isoDate(date: Date) {
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export interface DayNotice {
  title: string;
  detail: string;
  upcoming?: boolean;
}

// Which weekday's classes meet on a date, accounting for breaks and swaps.
export function scheduleDayOf(date: Date) {
  const iso = isoDate(date);
  if (iso < TERM.firstDay || iso > TERM.lastDay) return NO_CLASSES;
  if (CLOSURES.some((c) => iso >= c.from && iso <= c.to)) return NO_CLASSES;
  return DAY_SWAPS[iso]?.day ?? dayCodeOf(date);
}

export function dayNotice(date: Date): DayNotice | null {
  const iso = isoDate(date);
  const closure = CLOSURES.find((c) => iso >= c.from && iso <= c.to);
  if (closure) return { title: closure.label, detail: closure.detail };
  const swap = DAY_SWAPS[iso];
  if (swap) {
    return {
      title: `${swap.label} schedule today`,
      detail: `Rutgers is running ${swap.label} classes today.`,
    };
  }
  if (iso < TERM.firstDay) {
    return { title: "Classes haven't started", detail: `The ${TERM.label} term begins soon.` };
  }
  if (iso > TERM.lastDay) {
    return {
      title: `${TERM.label} classes are over`,
      detail: "This schedule no longer reflects how rooms are used.",
    };
  }

  // Warn about a break starting within the next week.
  const weekAhead = new Date(date);
  weekAhead.setDate(weekAhead.getDate() + 7);
  const soon = CLOSURES.find((c) => c.from > iso && c.from <= isoDate(weekAhead));
  if (soon) {
    const starts = new Date(`${soon.from}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    return { title: `${soon.label} is coming up`, detail: `Starts ${starts}.`, upcoming: true };
  }
  return null;
}
