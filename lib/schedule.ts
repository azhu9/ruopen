import { Meeting } from "@/types";

// Day codes used in the class_meetings table, indexed by JS Date.getDay().
export const DAY_CODES = ["U", "M", "T", "W", "H", "F", "S"] as const;
export const WEEK_ORDER = ["M", "T", "W", "H", "F", "S", "U"];
export const DAY_NAMES: Record<string, { short: string; long: string }> = {
  M: { short: "Mon", long: "Monday" },
  T: { short: "Tue", long: "Tuesday" },
  W: { short: "Wed", long: "Wednesday" },
  H: { short: "Thu", long: "Thursday" },
  F: { short: "Fri", long: "Friday" },
  S: { short: "Sat", long: "Saturday" },
  U: { short: "Sun", long: "Sunday" },
};

export interface CourseInfo {
  subject: string;
  course_number: string;
  course_title: string | null;
  sections: string[];
  instructors: string[];
}

// One occupied time slot in a room. Cross-listed courses that share the
// slot are merged into a single block.
export interface ClassBlock {
  key: string;
  day: string;
  start: number; // minutes since midnight
  end: number;
  courses: CourseInfo[];
}

// Hours shown on timelines and used as the edges of "free" gaps.
export const DAY_START = 8 * 60;
export const DAY_END = 22 * 60;

// Times are stored as "HHMM" without AM/PM, so infer the afternoon/evening
// slots the same way the original calendar did.
function parseTimes(startTime: string, endTime: string) {
  let startHour = parseInt(startTime.substring(0, 2));
  const startMinute = parseInt(startTime.substring(2, 4));
  let endHour = parseInt(endTime.substring(0, 2));
  const endMinute = parseInt(endTime.substring(2, 4));

  if (startHour < 8) startHour += 12;
  if (endHour < 8) endHour += 12;
  if (endHour < startHour && startHour > 12) endHour += 12;
  if (startHour === 9 && (startMinute === 20 || startMinute === 35))
    startHour += 12;
  if (endHour === 10 && (endMinute === 30 || endMinute === 40)) endHour += 12;

  return {
    start: startHour * 60 + startMinute,
    end: endHour * 60 + endMinute,
  };
}

export function buildBlocks(meetings: Meeting[]): ClassBlock[] {
  const blocks = new Map<string, ClassBlock>();

  for (const m of meetings) {
    if (
      !m.subject ||
      !m.course_number ||
      !m.meeting_day ||
      !m.start_time ||
      !m.end_time ||
      !DAY_NAMES[m.meeting_day]
    ) {
      continue;
    }
    const { start, end } = parseTimes(m.start_time, m.end_time);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;

    const key = `${m.meeting_day}:${start}:${end}`;
    let block = blocks.get(key);
    if (!block) {
      block = { key, day: m.meeting_day, start, end, courses: [] };
      blocks.set(key, block);
    }

    let course = block.courses.find(
      (c) => c.subject === m.subject && c.course_number === m.course_number
    );
    if (!course) {
      course = {
        subject: m.subject,
        course_number: m.course_number,
        course_title: m.course_title,
        sections: [],
        instructors: [],
      };
      block.courses.push(course);
    }
    if (m.section_index && !course.sections.includes(m.section_index)) {
      course.sections.push(m.section_index);
    }
    if (m.instructors && !course.instructors.includes(m.instructors)) {
      course.instructors.push(m.instructors);
    }
  }

  const result = [...blocks.values()];
  for (const b of result) {
    for (const c of b.courses) c.sections.sort();
  }
  return result.sort((a, b) => a.start - b.start);
}

export function minutesOf(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function dayCodeOf(date: Date) {
  return DAY_CODES[date.getDay()];
}

export function formatTime(mins: number, withPeriod = true) {
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const time = `${h12}:${m.toString().padStart(2, "0")}`;
  return withPeriod ? `${time} ${h24 < 12 ? "AM" : "PM"}` : time;
}

export function formatRange(start: number, end: number) {
  const samePeriod = start < 720 === end < 720;
  return `${formatTime(start, !samePeriod)} – ${formatTime(end)}`;
}

export function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h} hr ${m} min`;
  if (h) return `${h} hr`;
  return `${m} min`;
}

export function compareRooms(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true });
}
