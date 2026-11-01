"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { LuCircleX, LuSearch } from "react-icons/lu";
import { compareRooms } from "@/lib/schedule";
import { fetchBuilding, fetchBuildingNames } from "@/lib/data";
import { useAsync, useNow, useRecents } from "@/lib/hooks";
import { NOW, availability } from "@/lib/when";
import RoomRow, { roomHref } from "@/components/RoomRow";
import PlaceRow from "@/components/PlaceRow";
import { ListSkeleton } from "@/components/States";

export default function SearchPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <Search />
    </Suspense>
  );
}

// "HLL 114", "hll114" and "hill 114" all mean building + room.
function parseQuery(q: string, names: Map<string, string> | null) {
  const trimmed = q.trim().toUpperCase();
  const match = trimmed.match(/^(.*?)[\s-]*(\d[\w-]*)$/);
  if (match && names) {
    const [, head, room] = match;
    const headTrim = head.trim();
    if (names.has(headTrim)) return { text: trimmed, code: headTrim, room };
    const byName = [...names.entries()].filter(([, n]) =>
      n.toUpperCase().startsWith(headTrim)
    );
    if (headTrim.length >= 3 && byName.length === 1) {
      return { text: trimmed, code: byName[0][0], room };
    }
  }
  return { text: trimmed, code: names?.has(trimmed) ? trimmed : null, room: "" };
}

function Search() {
  const router = useRouter();
  const params = useSearchParams();
  const now = useNow();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const { recents, clear } = useRecents();
  const names = useAsync(fetchBuildingNames, []);

  const updateQuery = (value: string) => {
    setQuery(value);
    const qs = value ? `?q=${encodeURIComponent(value)}` : "";
    router.replace(`/search${qs}`, { scroll: false });
  };

  const parsed = parseQuery(query, names.data);

  const buildingMatches = useMemo(() => {
    if (!names.data || !parsed.text || parsed.room) return [];
    const term = parsed.text;
    const score = (code: string, name: string) => {
      const upper = name.toUpperCase();
      if (code === term) return 0;
      if (code.startsWith(term)) return 1;
      if (upper.startsWith(term)) return 2;
      if (upper.split(/\s+/).some((w) => w.startsWith(term))) return 3;
      if (upper.includes(term)) return 4;
      return 9;
    };
    return [...names.data.entries()]
      .map(([code, name]) => ({ code, name, s: score(code, name) }))
      .filter((b) => b.s < 9)
      .sort((a, b) => a.s - b.s || a.code.localeCompare(b.code))
      .slice(0, 8);
  }, [names.data, parsed.text, parsed.room]);

  const building = useAsync(
    parsed.code ? () => fetchBuilding(parsed.code!) : null,
    [parsed.code]
  );
  const roomMatches = useMemo(() => {
    if (!parsed.code || !building.data) return [];
    return building.data.rooms
      .filter((r) => r.room.toUpperCase().startsWith(parsed.room))
      .sort((a, b) => compareRooms(a.room, b.room))
      .slice(0, 12)
      .map((r) => ({ ...r, status: availability(r.blocks, NOW, now) }));
  }, [parsed.code, parsed.room, building.data, now]);

  const firstHref = parsed.room
    ? roomMatches[0] && roomHref(parsed.code!, roomMatches[0].room, NOW)
    : buildingMatches[0] && `/b/${encodeURIComponent(buildingMatches[0].code)}`;

  return (
    <div className="pt-6 sm:pt-12">
      <h1 className="text-[34px] font-semibold leading-tight tracking-tight sm:text-5xl">
        Search
      </h1>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (firstHref) router.push(firstHref);
        }}
        className="mt-5 flex h-11 items-center gap-2.5 rounded-xl bg-fill px-3.5"
      >
        <LuSearch className="size-[18px] shrink-0 text-label-2" />
        <input
          autoFocus
          type="search"
          enterKeyHint="go"
          value={query}
          onChange={(e) => updateQuery(e.target.value)}
          placeholder="Building or room, e.g. HLL 114"
          aria-label="Search buildings and rooms"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent text-[17px] placeholder:text-label-2 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => updateQuery("")}
            aria-label="Clear search"
            className="text-label-3 hover:text-label-2"
          >
            <LuCircleX className="size-[18px]" />
          </button>
        )}
      </form>

      <div className="mt-6">
        {!query.trim() ? (
          recents.length > 0 ? (
            <section>
              <div className="mb-2 flex items-baseline justify-between px-1">
                <h2 className="text-[20px] font-semibold tracking-tight">Recent</h2>
                <button type="button" onClick={clear} className="text-[15px] text-tint">
                  Clear
                </button>
              </div>
              <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
                {recents.map((r) => (
                  <PlaceRow
                    key={`${r.code}-${r.room ?? ""}`}
                    href={
                      r.room
                        ? roomHref(r.code, r.room, NOW)
                        : `/b/${encodeURIComponent(r.code)}`
                    }
                    title={r.room ? `${r.code} ${r.room}` : r.code}
                    subtitle={names.data?.get(r.code)}
                    icon="recent"
                  />
                ))}
              </ul>
            </section>
          ) : (
            <p className="px-1 text-[15px] text-label-2">
              Try “ARC”, “Hill Center” or “HLL 114”.
            </p>
          )
        ) : names.loading ? (
          <ListSkeleton rows={3} />
        ) : parsed.room ? (
          <section>
            <ul className="mb-4 overflow-hidden rounded-2xl bg-surface shadow-card">
              <PlaceRow
                href={`/b/${encodeURIComponent(parsed.code!)}`}
                title={parsed.code!}
                subtitle={names.data?.get(parsed.code!)}
                icon="building"
              />
            </ul>
            {building.loading ? (
              <ListSkeleton rows={3} />
            ) : roomMatches.length > 0 ? (
              <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
                {roomMatches.map((r) => (
                  <RoomRow
                    key={r.room}
                    code={parsed.code!}
                    room={r.room}
                    blocks={r.blocks}
                    status={r.status}
                    when={NOW}
                    now={now}
                    showBuilding
                  />
                ))}
              </ul>
            ) : (
              <p className="px-1 text-[15px] text-label-2">
                No room “{parsed.room}” in {parsed.code}.
              </p>
            )}
          </section>
        ) : buildingMatches.length > 0 ? (
          <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
            {buildingMatches.map((b) => (
              <PlaceRow
                key={b.code}
                href={`/b/${encodeURIComponent(b.code)}`}
                title={b.code}
                subtitle={b.name}
                icon="building"
              />
            ))}
          </ul>
        ) : (
          <p className="px-1 text-[15px] text-label-2">
            No buildings match “{query.trim()}”.
          </p>
        )}
      </div>
    </div>
  );
}
