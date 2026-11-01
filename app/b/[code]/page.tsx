"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo } from "react";
import { CAMPUSES, fetchBuilding, fetchBuildingNames } from "@/lib/data";
import { useAsync, useNow, useRecents } from "@/lib/hooks";
import {
  availability,
  compareAvailability,
  parseWhen,
  whenQuery,
} from "@/lib/when";
import BackButton from "@/components/BackButton";
import RoomRow from "@/components/RoomRow";
import WhenPicker from "@/components/WhenPicker";
import { ListSkeleton, Message } from "@/components/States";

export default function BuildingPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <Building />
    </Suspense>
  );
}

function Building() {
  const router = useRouter();
  const params = useSearchParams();
  const code = decodeURIComponent(useParams<{ code: string }>().code).toUpperCase();
  const when = parseWhen(params);
  const now = useNow();
  const { add } = useRecents();

  const building = useAsync(() => fetchBuilding(code), [code]);
  const names = useAsync(fetchBuildingNames, []);
  const name = names.data?.get(code);
  const campus = CAMPUSES.find((c) => c.id === building.data?.campus);

  const hasRooms = !!building.data?.rooms.length;
  useEffect(() => {
    if (hasRooms) add({ code });
  }, [hasRooms, code, add]);

  const rooms = useMemo(
    () =>
      (building.data?.rooms ?? [])
        .map((r) => ({ ...r, status: availability(r.blocks, when, now) }))
        .sort((a, b) => compareAvailability(a.status, b.status)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [building.data, whenQuery(when), now]
  );
  const freeCount = rooms.filter((r) => r.status.kind === "free").length;

  return (
    <div className="pt-4">
      <BackButton label="Back" fallback="/" />
      <h1 className="mt-3 text-[34px] font-semibold leading-tight tracking-tight sm:text-5xl">
        {code}
      </h1>
      {(name || campus) && (
        <p className="mt-1 text-[15px] text-label-2">
          {[name, campus?.label].filter(Boolean).join(" · ")}
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-label-2">
          {building.data && rooms.length > 0
            ? `${freeCount} of ${rooms.length} rooms free`
            : " "}
        </p>
        <WhenPicker
          when={when}
          now={now}
          onChange={(w) => router.replace(`/b/${encodeURIComponent(code)}${whenQuery(w)}`, { scroll: false })}
        />
      </div>

      <div className="mt-4">
        {building.loading ? (
          <ListSkeleton rows={6} />
        ) : building.error ? (
          <Message title="Couldn't load this building" text={building.error} />
        ) : rooms.length === 0 ? (
          <Message
            title={`No rooms found for “${code}”`}
            text="Try searching for the building by name."
          />
        ) : (
          <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
            {rooms.map((r) => (
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
          </ul>
        )}
      </div>
    </div>
  );
}
