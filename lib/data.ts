import { supabase } from "./supabaseClient";
import { Meeting } from "@/types";
import { ClassBlock, buildBlocks, compareRooms } from "./schedule";

export const CAMPUSES = [
  { slug: "cac", id: "COLLEGE AVENUE", label: "College Ave" },
  { slug: "busch", id: "BUSCH", label: "Busch" },
  { slug: "livi", id: "LIVINGSTON", label: "Livingston" },
  { slug: "cook", id: "DOUGLAS/COOK", label: "Cook/Douglas" },
  { slug: "downtown", id: "DOWNTOWN NB", label: "Downtown" },
];
export type Campus = (typeof CAMPUSES)[number];

const PAGE_SIZE = 1000;
const FULL_COLUMNS =
  "id, course_title, subject, course_number, section_index, instructors, meeting_day, start_time, end_time, building_code, room_number, campus";
const TIME_COLUMNS =
  "id, subject, course_number, meeting_day, start_time, end_time, building_code, room_number";

// Requests are cached for the session so moving between pages is instant.
const cache = new Map<string, Promise<unknown>>();
function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (!cache.has(key)) {
    cache.set(
      key,
      load().catch((err) => {
        cache.delete(key);
        throw err;
      })
    );
  }
  return cache.get(key) as Promise<T>;
}

// Supabase caps responses at 1000 rows, so page through larger result sets.
async function fetchMeetings(
  columns: string,
  filter: { column: string; value: string; exact: boolean }
) {
  const meetings: Meeting[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    let query = supabase.from("class_meetings").select(columns);
    query = filter.exact
      ? query.eq(filter.column, filter.value)
      : query.ilike(filter.column, filter.value);
    const { data, error } = await query
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    meetings.push(...((data ?? []) as unknown as Meeting[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return meetings;
}

export interface BuildingInfo {
  code: string;
  name: string;
}

export function fetchBuildingNames() {
  return cached("buildings", async () => {
    const names = new Map<string, string>();
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("building_codes")
        .select("building_code, full_name")
        .order("building_code")
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      for (const row of data ?? []) {
        names.set(row.building_code.toUpperCase(), row.full_name);
      }
      if (!data || data.length < PAGE_SIZE) break;
    }
    return names;
  });
}

export interface RoomData {
  room: string;
  blocks: ClassBlock[];
}

export interface BuildingData {
  code: string;
  rooms: RoomData[];
}

function groupByBuilding(meetings: Meeting[]): BuildingData[] {
  const buildings = new Map<string, Map<string, Meeting[]>>();
  for (const m of meetings) {
    if (!m.building_code || !m.room_number) continue;
    const code = m.building_code.toUpperCase();
    const rooms = buildings.get(code) ?? new Map<string, Meeting[]>();
    const list = rooms.get(m.room_number) ?? [];
    list.push(m);
    rooms.set(m.room_number, list);
    buildings.set(code, rooms);
  }
  return [...buildings.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([code, rooms]) => ({
      code,
      rooms: [...rooms.entries()]
        .sort(([a], [b]) => compareRooms(a, b))
        .map(([room, list]) => ({ room, blocks: buildBlocks(list) })),
    }));
}

export function fetchCampus(campusId: string) {
  return cached(`campus:${campusId}`, async () =>
    groupByBuilding(
      await fetchMeetings(TIME_COLUMNS, {
        column: "campus",
        value: campusId,
        exact: true,
      })
    )
  );
}

export function fetchBuilding(code: string) {
  return cached(`building:${code}`, async () => {
    const meetings = await fetchMeetings(FULL_COLUMNS, {
      column: "building_code",
      value: code,
      exact: false,
    });
    const campus = meetings.find((m) => m.campus)?.campus ?? null;
    const building = groupByBuilding(meetings)[0] ?? { code, rooms: [] };
    return { ...building, code, campus };
  });
}
