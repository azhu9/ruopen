"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuChevronLeft } from "react-icons/lu";
import { supabase } from "../lib/supabaseClient";
import { Meeting } from "../types";
import { buildBlocks, compareRooms, roomStatus } from "@/lib/schedule";

import Header from "@/components/Header";
import HowTo from "@/components/HowTo";
import SearchBar from "@/components/SearchBar";
import RoomList from "@/components/RoomList";
import ScheduleView from "@/components/ScheduleView";
import StatusLabel from "@/components/StatusLabel";
import Footer from "@/components/Footer";

interface LoadedBuilding {
  code: string;
  fullName: string;
  meetings: Meeting[];
}

const MEETING_COLUMNS =
  "id, course_title, subject, course_number, section_index, instructors, meeting_day, start_time, end_time, room_number";
const PAGE_SIZE = 1000;

// Loads every meeting in a building (paged past Supabase's 1000-row cap) so
// the room list, "free now" status and schedules need no further queries.
async function fetchBuilding(code: string): Promise<LoadedBuilding> {
  const namePromise = supabase
    .from("building_codes")
    .select("full_name")
    .ilike("building_code", code)
    .maybeSingle()
    .then((res) => res);

  const meetings: Meeting[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("class_meetings")
      .select(MEETING_COLUMNS)
      .ilike("building_code", code)
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    meetings.push(...((data ?? []) as unknown as Meeting[]));
    if (!data || data.length < PAGE_SIZE) break;
  }

  const { data: nameData, error: nameError } = await namePromise;
  if (nameError) {
    console.error("Could not fetch building full name:", nameError.message);
  }
  return { code, fullName: nameData?.full_name ?? "", meetings };
}

function listRooms(meetings: Meeting[]) {
  return [
    ...new Set(
      meetings.map((m) => m.room_number).filter((r): r is string => !!r)
    ),
  ].sort(compareRooms);
}

function writeUrl(
  building: string | null,
  room: string | null,
  mode: "push" | "replace",
  state: Record<string, unknown> | null = null
) {
  const params = new URLSearchParams();
  if (building) params.set("b", building);
  if (room) params.set("r", room);
  const qs = params.toString();
  const url = qs ? `?${qs}` : window.location.pathname;
  if (window.location.search === (qs ? `?${qs}` : "")) mode = "replace";
  if (mode === "push") window.history.pushState(state, "", url);
  else window.history.replaceState(state, "", url);
}

export default function HomePage() {
  const [building, setBuilding] = useState("");
  const [room, setRoom] = useState("");
  const [loaded, setLoaded] = useState<LoadedBuilding | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const loadedRef = useRef<LoadedBuilding | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const loadBuilding = useCallback(async (code: string) => {
    if (loadedRef.current?.code === code) return loadedRef.current;
    const id = ++requestRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBuilding(code);
      if (id !== requestRef.current) return null;
      loadedRef.current = result;
      setLoaded(result);
      return result;
    } catch (err) {
      if (id === requestRef.current) {
        loadedRef.current = null;
        setLoaded(null);
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
      return null;
    } finally {
      if (id === requestRef.current) setLoading(false);
    }
  }, []);

  const resetToHome = useCallback(() => {
    requestRef.current++;
    loadedRef.current = null;
    setLoaded(null);
    setSelectedRoom(null);
    setLoading(false);
    setError(null);
    setNotice(null);
  }, []);

  // The URL (?b=ARC&r=105) is the source of truth for what's on screen, so
  // links can be shared and the browser back button works.
  const applyUrl = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const b = params.get("b")?.trim().toUpperCase() || null;
    const r = params.get("r")?.trim() || null;
    if (!b) {
      resetToHome();
      return;
    }
    setNotice(null);
    setBuilding(b);
    setSelectedRoom(r);
    await loadBuilding(b);
  }, [loadBuilding, resetToHome]);

  useEffect(() => {
    applyUrl();
    window.addEventListener("popstate", applyUrl);
    return () => window.removeEventListener("popstate", applyUrl);
  }, [applyUrl]);

  const searchSchedule = async (codeOverride?: string) => {
    const code = (codeOverride ?? building).trim().toUpperCase();
    setNotice(null);
    if (!code) {
      setNotice("Enter a building code or name to search.");
      return;
    }

    setSelectedRoom(null);
    const result = await loadBuilding(code);
    if (!result) return;

    const wanted = room.trim().toLowerCase();
    let match: string | null = null;
    if (wanted) {
      match = listRooms(result.meetings).find((r) => r.toLowerCase() === wanted) ?? null;
      if (!match && result.meetings.length > 0) {
        setNotice(`There's no room “${room.trim()}” in ${code}. Showing all rooms.`);
      }
    }
    writeUrl(code, match, "push", match ? { fromList: false } : null);
    setSelectedRoom(match);
  };

  const selectRoom = (r: string) => {
    if (!loaded) return;
    writeUrl(loaded.code, r, "push", { fromList: true });
    setSelectedRoom(r);
    window.scrollTo(0, 0);
  };

  const backToRooms = () => {
    if (window.history.state?.fromList) {
      window.history.back();
      return;
    }
    writeUrl(loaded?.code ?? null, null, "replace");
    setSelectedRoom(null);
  };

  const goHome = () => {
    writeUrl(null, null, "push");
    resetToHome();
    setBuilding("");
    setRoom("");
    window.scrollTo(0, 0);
  };

  const roomEntries = useMemo(() => {
    if (!loaded) return [];
    const byRoom = new Map<string, Meeting[]>();
    for (const m of loaded.meetings) {
      if (!m.room_number) continue;
      const list = byRoom.get(m.room_number) ?? [];
      list.push(m);
      byRoom.set(m.room_number, list);
    }
    return [...byRoom.entries()]
      .sort(([a], [b]) => compareRooms(a, b))
      .map(([room, meetings]) => ({ room, blocks: buildBlocks(meetings) }));
  }, [loaded]);

  const roomsWithStatus = useMemo(
    () =>
      roomEntries.map(({ room, blocks }) => ({
        room,
        status: roomStatus(blocks, now),
      })),
    [roomEntries, now]
  );

  const selectedEntry =
    loaded && selectedRoom
      ? roomEntries.find((e) => e.room.toLowerCase() === selectedRoom.toLowerCase())
      : undefined;

  const atHome = !loaded && !loading && !error;
  const buildingLabel = loaded ? loaded.fullName || loaded.code : "";

  return (
    <div className="flex min-h-dvh flex-col">
      <Header onHome={goHome} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 sm:px-6">
        {selectedEntry && loaded ? (
          <section className="pt-4 animate-in fade-in-0 duration-300">
            <button
              type="button"
              onClick={backToRooms}
              className="-ml-1.5 flex items-center gap-0.5 rounded-lg py-1 pr-2 text-[17px] text-tint hover:opacity-80"
            >
              <LuChevronLeft className="size-6" />
              {loaded.code}
            </button>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Room {selectedEntry.room}
            </h1>
            <p className="mt-1 text-[15px] text-label-2">{buildingLabel}</p>
            <StatusLabel
              status={roomStatus(selectedEntry.blocks, now)}
              className="mt-3 rounded-full bg-surface px-3 py-1.5 shadow-card"
            />
            <ScheduleView
              key={`${loaded.code}-${selectedEntry.room}`}
              blocks={selectedEntry.blocks}
              now={now}
            />
          </section>
        ) : (
          <>
            {atHome ? (
              <div className="pb-8 pt-14 text-center sm:pb-10 sm:pt-24">
                <h1 className="text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
                  Find an open room.
                </h1>
                <p className="mx-auto mt-4 max-w-md text-[17px] leading-snug text-label-2 sm:text-xl">
                  Search any classroom at Rutgers–New Brunswick and see when
                  it&apos;s free.
                </p>
              </div>
            ) : (
              <div className="pt-6" />
            )}

            <div className="mx-auto max-w-2xl">
              <SearchBar
                building={building}
                room={room}
                onBuildingChange={setBuilding}
                onRoomChange={setRoom}
                onSearch={searchSchedule}
                loading={loading}
              />
              {notice && (
                <p className="mt-3 px-1 text-sm text-label-2 animate-in fade-in-0">
                  {notice}
                </p>
              )}
            </div>

            {atHome && <HowTo />}

            <div className="mt-10">
              {loading && <Spinner />}
              {error && !loading && (
                <p className="text-center text-[15px] text-busy">
                  Something went wrong: {error}
                </p>
              )}
              {loaded && !loading && !error && (
                roomsWithStatus.length > 0 ? (
                  <RoomList
                    key={loaded.code}
                    buildingCode={loaded.code}
                    buildingName={loaded.fullName}
                    rooms={roomsWithStatus}
                    onSelect={selectRoom}
                  />
                ) : (
                  <div className="text-center">
                    <p className="text-lg font-semibold">
                      No rooms found for “{loaded.code}”
                    </p>
                    <p className="mt-1 text-[15px] text-label-2">
                      Try a building code like ARC or pick one from the
                      suggestions.
                    </p>
                  </div>
                )
              )}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-10" role="status" aria-label="Loading">
      <span className="size-6 animate-spin rounded-full border-2 border-fill border-t-label-2" />
    </div>
  );
}
