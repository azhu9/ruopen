"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { LuChevronDown, LuChevronRight, LuSearch } from "react-icons/lu";
import { CAMPUSES, RoomData, fetchBuildingNames, fetchCampus } from "@/lib/data";
import { useAsync, useNow, useStored } from "@/lib/hooks";
import { formatTime, minutesOf } from "@/lib/schedule";
import { dayNotice } from "@/lib/calendar";
import { ReportCounts, fetchRecentReports, reportKey } from "@/lib/reports";
import locations from "@/lib/buildingLocations.json";
import {
  Availability,
  When,
  availability,
  compareAvailability,
  parseWhen,
  whenParams,
  whenQuery,
} from "@/lib/when";
import CampusPicker from "@/components/CampusPicker";
import WhenPicker from "@/components/WhenPicker";
import RoomRow from "@/components/RoomRow";
import Segmented from "@/components/Segmented";
import { DataNotice, DayBanner } from "@/components/Notices";
import { ListSkeleton, Message } from "@/components/States";
import type { MapPin } from "@/components/CampusMap";

const CampusMap = dynamic(() => import("@/components/CampusMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[58dvh] min-h-[340px] animate-pulse rounded-2xl bg-fill" />
  ),
});

const ROOMS_PER_BUILDING = 4;
const OPENING_SOON_MINS = 30;
const SECTION_PREVIEW = 6;
// Building coordinates from Rutgers' public building list (ArcGIS), joined on
// building number. Regenerate when buildings are added.
const LOCATIONS: Record<string, number[]> = locations;

interface RoomResult extends RoomData {
  code: string;
  status: Availability;
}

export default function FreeRoomsPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <FreeRooms />
    </Suspense>
  );
}

function FreeRooms() {
  const router = useRouter();
  const params = useSearchParams();
  const now = useNow();
  const [storedCampus, setStoredCampus] = useStored("campus", "cac");
  const [view, setView] = useStored<"list" | "map">("home-view", "list");
  const [selected, setSelected] = useState<string | null>(null);

  // Links from the previous version of the site used ?b=ARC&r=105.
  const legacyBuilding = params.get("b");
  useEffect(() => {
    if (!legacyBuilding) return;
    const room = params.get("r");
    router.replace(
      `/b/${encodeURIComponent(legacyBuilding.toUpperCase())}${
        room ? `/${encodeURIComponent(room)}` : ""
      }`
    );
  }, [legacyBuilding, params, router]);

  const campus =
    CAMPUSES.find((c) => c.slug === params.get("campus")) ??
    CAMPUSES.find((c) => c.slug === storedCampus) ??
    CAMPUSES[0];
  const when = parseWhen(params);
  const notice = dayNotice(now);

  const updateUrl = (slug: string, next: When) => {
    const qs = new URLSearchParams({ campus: slug, ...whenParams(next) });
    router.replace(`/?${qs}`, { scroll: false });
  };

  const buildings = useAsync(() => fetchCampus(campus.id), [campus.id]);
  const names = useAsync(fetchBuildingNames, []);
  const reports = useAsync(fetchRecentReports, []);

  const results = useMemo(() => {
    if (!buildings.data) return null;
    const t = minutesOf(now);
    const groups: { code: string; rooms: RoomResult[] }[] = [];
    const partial: RoomResult[] = [];
    const opening: RoomResult[] = [];
    const pins: MapPin[] = [];

    for (const b of buildings.data) {
      const rooms = b.rooms
        .map((r) => ({ ...r, code: b.code, status: availability(r.blocks, when, now) }))
        .sort((x, y) => compareAvailability(x.status, y.status));
      const free = rooms.filter((r) => r.status.kind === "free");
      if (free.length) groups.push({ code: b.code, rooms: free });
      partial.push(...rooms.filter((r) => r.status.kind === "partial"));
      for (const r of rooms) {
        const freeAt = r.status.freeAt;
        if (freeAt !== undefined && freeAt - t <= OPENING_SOON_MINS) {
          opening.push({
            ...r,
            status: { kind: "partial", text: `Free at ${formatTime(freeAt)}`, score: -freeAt },
          });
        }
      }
      const loc = LOCATIONS[b.code];
      if (loc) pins.push({ code: b.code, lat: loc[0], lng: loc[1], free: free.length });
    }

    groups.sort((a, b) => b.rooms.length - a.rooms.length);
    partial.sort((a, b) => compareAvailability(a.status, b.status));
    opening.sort((a, b) => b.status.score - a.status.score);
    const freeCount = groups.reduce((n, g) => n + g.rooms.length, 0);
    const unmapped = buildings.data.length - pins.length;
    return { groups, partial, opening, pins, freeCount, unmapped };
    // `when` is derived from the URL; compare by its serialized form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings.data, whenQuery(when), now]);

  if (legacyBuilding) return <ListSkeleton />;

  const selectedGroup =
    selected && buildings.data?.find((b) => b.code === selected)
      ? (results?.groups.find((g) => g.code === selected) ?? { code: selected, rooms: [] })
      : null;

  return (
    <div className="pt-8 sm:pt-12">
      <h1 className="text-[34px] font-semibold leading-tight tracking-tight sm:text-5xl">
        Free rooms
      </h1>

      <Link
        href="/search"
        className="mt-5 flex h-11 items-center gap-2.5 rounded-xl bg-fill px-3.5 text-[17px] text-label-2 transition-colors hover:text-label"
      >
        <LuSearch className="size-[18px]" />
        Search buildings and rooms
      </Link>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <CampusPicker
          value={campus.slug}
          onChange={(slug) => {
            setStoredCampus(slug);
            setSelected(null);
            updateUrl(slug, when);
          }}
        />
        <div>
          <WhenPicker when={when} now={now} onChange={(w) => updateUrl(campus.slug, w)} />
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {notice && (when.mode === "now" || notice.upcoming) && (
          <DayBanner notice={notice} />
        )}
        <DataNotice />
      </div>

      <div className="mt-8">
        {buildings.loading || (!results && !buildings.error) ? (
          <ListSkeleton />
        ) : buildings.error ? (
          <Message title="Couldn't load rooms" text={buildings.error} />
        ) : (
          results && (
            <>
              <div className="mb-4 flex items-center justify-between gap-4 px-1">
                <p className="text-[15px] text-label-2">
                  {results.freeCount} {results.freeCount === 1 ? "room" : "rooms"} free
                  <span className="hidden sm:inline">
                    {" "}in {results.groups.length}{" "}
                    {results.groups.length === 1 ? "building" : "buildings"}
                  </span>
                </p>
                <Segmented
                  label="View"
                  value={view}
                  onChange={setView}
                  options={[
                    { value: "list", label: "List" },
                    { value: "map", label: "Map" },
                  ]}
                  className="w-36 shrink-0"
                />
              </div>

              {view === "map" ? (
                <>
                  <CampusMap
                    pins={results.pins}
                    selected={selected}
                    onSelect={setSelected}
                  />
                  {results.unmapped > 0 && (
                    <p className="mt-2 px-1 text-[12px] text-label-2">
                      {results.unmapped}{" "}
                      {results.unmapped === 1 ? "building isn't" : "buildings aren't"} on
                      the map yet. Switch to List to see them.
                    </p>
                  )}
                  <div className="mt-6">
                    {selectedGroup ? (
                      <BuildingGroup
                        key={selectedGroup.code}
                        code={selectedGroup.code}
                        name={names.data?.get(selectedGroup.code)}
                        rooms={selectedGroup.rooms}
                        when={when}
                        now={now}
                        reports={reports.data}
                      />
                    ) : (
                      <p className="px-1 text-center text-[15px] text-label-2">
                        Tap a building to see its free rooms.
                      </p>
                    )}
                  </div>
                </>
              ) : results.freeCount === 0 && results.opening.length === 0 ? (
                <Message
                  title="No free rooms"
                  text={`Every room on ${campus.label} is in use then. Try another time.`}
                />
              ) : (
                <div className="flex flex-col gap-6">
                  {results.groups.map((g) => (
                    <BuildingGroup
                      key={`${campus.slug}-${g.code}`}
                      code={g.code}
                      name={names.data?.get(g.code)}
                      rooms={g.rooms}
                      when={when}
                      now={now}
                      reports={reports.data}
                    />
                  ))}
                </div>
              )}

              {view === "list" && results.opening.length > 0 && (
                <RoomSection
                  title="Opening soon"
                  rooms={results.opening}
                  when={when}
                  now={now}
                  reports={reports.data}
                  defaultOpen
                />
              )}
              {view === "list" && results.partial.length > 0 && (
                <RoomSection
                  title="Partly free"
                  rooms={results.partial}
                  when={when}
                  now={now}
                  reports={reports.data}
                />
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}

function BuildingGroup({
  code,
  name,
  rooms,
  when,
  now,
  reports,
}: {
  code: string;
  name?: string;
  rooms: RoomResult[];
  when: When;
  now: Date;
  reports: ReportCounts | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rooms : rooms.slice(0, ROOMS_PER_BUILDING);
  const hidden = rooms.length - shown.length;

  return (
    <section>
      <Link
        href={`/b/${encodeURIComponent(code)}${whenQuery(when)}`}
        className="group mb-2 flex items-end justify-between gap-3 px-1"
      >
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-[20px] font-semibold tracking-tight">{code}</span>
          {name && <span className="truncate text-[15px] text-label-2">{name}</span>}
        </span>
        <span className="flex shrink-0 items-center gap-0.5 text-[15px] text-label-2 group-hover:text-label">
          {rooms.length ? `${rooms.length} free` : "All rooms"}
          <LuChevronRight className="size-4" />
        </span>
      </Link>
      {rooms.length === 0 ? (
        <p className="rounded-2xl bg-surface px-4 py-4 text-[15px] text-label-2 shadow-card">
          No rooms free here then.
        </p>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
          {shown.map((r) => (
            <RoomRow
              key={r.room}
              code={code}
              room={r.room}
              blocks={r.blocks}
              status={r.status}
              when={when}
              now={now}
              reports={reports?.get(reportKey(code, r.room))}
            />
          ))}
          {hidden > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="w-full border-t border-separator px-4 py-3 text-left text-[15px] text-tint hover:bg-fill/50"
              >
                Show {hidden} more
              </button>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

function RoomSection({
  title,
  rooms,
  when,
  now,
  reports,
  defaultOpen = false,
}: {
  title: string;
  rooms: RoomResult[];
  when: When;
  now: Date;
  reports: ReportCounts | null;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rooms : rooms.slice(0, SECTION_PREVIEW);
  const hidden = rooms.length - shown.length;
  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mb-2 flex w-full items-center justify-between px-1 text-left"
      >
        <span className="text-[20px] font-semibold tracking-tight">
          {title}
          <span className="ml-2 text-[15px] font-normal text-label-2">
            {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
          </span>
        </span>
        <LuChevronDown
          className={`size-5 text-label-2 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul className="overflow-hidden rounded-2xl bg-surface shadow-card animate-in fade-in-0">
          {shown.map((r) => (
            <RoomRow
              key={`${r.code}-${r.room}`}
              code={r.code}
              room={r.room}
              blocks={r.blocks}
              status={r.status}
              when={when}
              now={now}
              reports={reports?.get(reportKey(r.code, r.room))}
              showBuilding
            />
          ))}
          {hidden > 0 && (
            <li>
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="w-full border-t border-separator px-4 py-3 text-left text-[15px] text-tint hover:bg-fill/50"
              >
                Show {hidden} more
              </button>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
