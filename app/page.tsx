"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { LuChevronDown, LuChevronRight, LuSearch } from "react-icons/lu";
import { CAMPUSES, fetchBuildingNames, fetchCampus } from "@/lib/data";
import { useAsync, useNow, useStored } from "@/lib/hooks";
import {
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
import { ListSkeleton, Message } from "@/components/States";

const ROOMS_PER_BUILDING = 4;

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

  const updateUrl = (slug: string, next: When) => {
    const qs = new URLSearchParams({ campus: slug, ...whenParams(next) });
    router.replace(`/?${qs}`, { scroll: false });
  };

  const buildings = useAsync(() => fetchCampus(campus.id), [campus.id]);
  const names = useAsync(fetchBuildingNames, []);

  const results = useMemo(() => {
    if (!buildings.data) return null;
    const groups = [];
    const partial = [];
    for (const b of buildings.data) {
      const rooms = b.rooms
        .map((r) => ({ ...r, status: availability(r.blocks, when, now) }))
        .sort((x, y) => compareAvailability(x.status, y.status));
      const free = rooms.filter((r) => r.status.kind === "free");
      if (free.length) groups.push({ code: b.code, rooms: free });
      partial.push(
        ...rooms
          .filter((r) => r.status.kind === "partial")
          .map((r) => ({ ...r, code: b.code }))
      );
    }
    groups.sort((a, b) => b.rooms.length - a.rooms.length);
    partial.sort((a, b) => compareAvailability(a.status, b.status));
    const freeCount = groups.reduce((n, g) => n + g.rooms.length, 0);
    return { groups, partial, freeCount };
    // `when` is derived from the URL; compare by its serialized form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildings.data, whenQuery(when), now]);

  if (legacyBuilding) return <ListSkeleton />;

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
            updateUrl(slug, when);
          }}
        />
        <div>
          <WhenPicker when={when} now={now} onChange={(w) => updateUrl(campus.slug, w)} />
        </div>
      </div>

      <div className="mt-8">
        {buildings.loading || (!results && !buildings.error) ? (
          <ListSkeleton />
        ) : buildings.error ? (
          <Message title="Couldn't load rooms" text={buildings.error} />
        ) : results && results.freeCount === 0 && results.partial.length === 0 ? (
          <Message
            title="No free rooms"
            text={`Every room on ${campus.label} is in use then. Try another time.`}
          />
        ) : (
          results && (
            <>
              <p className="mb-4 px-1 text-[15px] text-label-2">
                {results.freeCount} {results.freeCount === 1 ? "room" : "rooms"}{" "}
                free in {results.groups.length}{" "}
                {results.groups.length === 1 ? "building" : "buildings"}
              </p>
              <div className="flex flex-col gap-6">
                {results.groups.map((g) => (
                  <BuildingGroup
                    key={`${campus.slug}-${g.code}`}
                    code={g.code}
                    name={names.data?.get(g.code)}
                    rooms={g.rooms}
                    when={when}
                    now={now}
                  />
                ))}
              </div>
              {results.partial.length > 0 && (
                <PartlyFree rooms={results.partial} when={when} now={now} />
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}

type RoomResult = Parameters<typeof RoomRow>[0];

function BuildingGroup({
  code,
  name,
  rooms,
  when,
  now,
}: {
  code: string;
  name?: string;
  rooms: { room: string; blocks: RoomResult["blocks"]; status: RoomResult["status"] }[];
  when: When;
  now: Date;
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
          {name && (
            <span className="truncate text-[15px] text-label-2">{name}</span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-0.5 text-[15px] text-label-2 group-hover:text-label">
          {rooms.length} free
          <LuChevronRight className="size-4" />
        </span>
      </Link>
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
    </section>
  );
}

function PartlyFree({
  rooms,
  when,
  now,
}: {
  rooms: (Pick<RoomResult, "room" | "blocks" | "status"> & { code: string })[];
  when: When;
  now: Date;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="mb-2 flex w-full items-center justify-between px-1 text-left"
      >
        <span className="text-[20px] font-semibold tracking-tight">
          Partly free
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
          {rooms.map((r) => (
            <RoomRow
              key={`${r.code}-${r.room}`}
              code={r.code}
              room={r.room}
              blocks={r.blocks}
              status={r.status}
              when={when}
              now={now}
              showBuilding
            />
          ))}
        </ul>
      )}
    </section>
  );
}
