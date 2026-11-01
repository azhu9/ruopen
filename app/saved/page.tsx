"use client";

import { fetchBuilding, fetchBuildingNames } from "@/lib/data";
import { useAsync, useNow, useRecents, useSaved } from "@/lib/hooks";
import { NOW, availability } from "@/lib/when";
import RoomRow, { roomHref } from "@/components/RoomRow";
import PlaceRow from "@/components/PlaceRow";
import { ListSkeleton } from "@/components/States";

export default function SavedPage() {
  const now = useNow();
  const { saved } = useSaved();
  const { recents } = useRecents();
  const names = useAsync(fetchBuildingNames, []);

  const codes = [...new Set(saved.map((s) => s.code))];
  const buildings = useAsync(
    codes.length ? () => Promise.all(codes.map((c) => fetchBuilding(c))) : null,
    [codes.join(",")]
  );

  const rooms = saved.flatMap((s) => {
    const entry = buildings.data
      ?.find((b) => b.code === s.code)
      ?.rooms.find((r) => r.room === s.room);
    return entry
      ? [{ code: s.code, ...entry, status: availability(entry.blocks, NOW, now) }]
      : [];
  });

  return (
    <div className="pt-6 sm:pt-12">
      <h1 className="text-[34px] font-semibold leading-tight tracking-tight sm:text-5xl">
        Saved
      </h1>

      <section className="mt-6">
        {saved.length === 0 ? (
          <div className="rounded-2xl bg-surface px-6 py-10 text-center shadow-card">
            <p className="text-lg font-semibold">No saved rooms yet</p>
            <p className="mt-1 text-[15px] text-label-2">
              Tap the star on any room to keep it here.
            </p>
          </div>
        ) : buildings.loading ? (
          <ListSkeleton rows={saved.length} />
        ) : (
          <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
            {rooms.map((r) => (
              <RoomRow
                key={`${r.code}-${r.room}`}
                code={r.code}
                room={r.room}
                blocks={r.blocks}
                status={r.status}
                when={NOW}
                now={now}
                showBuilding
              />
            ))}
          </ul>
        )}
      </section>

      {recents.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-2 px-1 text-[20px] font-semibold tracking-tight">
            Recently viewed
          </h2>
          <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
            {recents.map((r) => (
              <PlaceRow
                key={`${r.code}-${r.room ?? ""}`}
                href={r.room ? roomHref(r.code, r.room, NOW) : `/b/${encodeURIComponent(r.code)}`}
                title={r.room ? `${r.code} ${r.room}` : r.code}
                subtitle={names.data?.get(r.code)}
                icon="recent"
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
