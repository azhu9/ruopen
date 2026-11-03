import { supabase } from "./supabaseClient";

// "This room was locked" reports from students, stored in the room_reports
// table (see supabase/room_reports.sql). If the table hasn't been created,
// every function here quietly reports nothing.

const WINDOW_DAYS = 7;
const REPORTED_KEY = "locked-reports-sent";

export type ReportCounts = Map<string, number>;

export const reportKey = (code: string, room: string) =>
  `${code.toUpperCase()}|${room.toUpperCase()}`;

// Resolves to null when reports are unavailable (e.g. the table is missing).
let recent: Promise<ReportCounts | null> | null = null;

export function fetchRecentReports(): Promise<ReportCounts | null> {
  if (!recent) {
    recent = (async () => {
      const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
      const { data, error } = await supabase
        .from("room_reports")
        .select("building_code, room_number")
        .gte("created_at", since)
        .limit(5000);
      if (error) return null;
      const counts: ReportCounts = new Map();
      for (const r of data ?? []) {
        const key = reportKey(r.building_code, r.room_number);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      return counts;
    })();
  }
  return recent;
}

function sentToday(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(REPORTED_KEY) ?? "{}");
  } catch {
    return {};
  }
}

const today = () => new Date().toISOString().slice(0, 10);

// One report per room per device per day keeps casual spam down.
export function alreadyReported(code: string, room: string) {
  return sentToday()[reportKey(code, room)] === today();
}

export async function reportLocked(code: string, room: string) {
  const { error } = await supabase
    .from("room_reports")
    .insert({ building_code: code.toUpperCase(), room_number: room });
  if (error) throw error;
  const sent = sentToday();
  sent[reportKey(code, room)] = today();
  try {
    localStorage.setItem(REPORTED_KEY, JSON.stringify(sent));
  } catch {}
  recent = null;
}
