"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { LuStar } from "react-icons/lu";
import { fetchBuilding, fetchBuildingNames } from "@/lib/data";
import { minutesOf } from "@/lib/schedule";
import { useAsync, useNow, useRecents, useSaved } from "@/lib/hooks";
import { availability, parseWhen, whenDay, whenQuery } from "@/lib/when";
import BackButton from "@/components/BackButton";
import ScheduleView from "@/components/ScheduleView";
import TimelineBar from "@/components/TimelineBar";
import WhenPicker from "@/components/WhenPicker";
import { ListSkeleton, Message } from "@/components/States";

export default function RoomPage() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <Room />
    </Suspense>
  );
}

const HERO_COLORS = { free: "text-ok", partial: "text-partial", busy: "text-label" };

function Room() {
  const router = useRouter();
  const params = useSearchParams();
  const routeParams = useParams<{ code: string; room: string }>();
  const code = decodeURIComponent(routeParams.code).toUpperCase();
  const roomParam = decodeURIComponent(routeParams.room);
  const when = parseWhen(params);
  const now = useNow();
  const { isSaved, toggle } = useSaved();
  const { add } = useRecents();

  const building = useAsync(() => fetchBuilding(code), [code]);
  const names = useAsync(fetchBuildingNames, []);
  const entry = building.data?.rooms.find(
    (r) => r.room.toLowerCase() === roomParam.toLowerCase()
  );
  const room = entry?.room ?? roomParam;

  useEffect(() => {
    if (entry) add({ code, room: entry.room });
  }, [entry, code, add]);

  const status = entry && availability(entry.blocks, when, now);
  const saved = isSaved(code, room);
  const day = whenDay(when, now);

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between">
        <BackButton label={code} fallback={`/b/${encodeURIComponent(code)}${whenQuery(when)}`} />
        {entry && (
          <button
            type="button"
            onClick={() => toggle(code, room)}
            aria-pressed={saved}
            aria-label={saved ? "Remove from saved" : "Save room"}
            className={`grid size-10 place-items-center rounded-full transition-colors hover:bg-fill ${
              saved ? "text-tint" : "text-label-2"
            }`}
          >
            <LuStar className="size-[22px]" fill={saved ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      <h1 className="mt-3 text-[34px] font-semibold leading-tight tracking-tight sm:text-5xl">
        Room {room}
      </h1>
      <p className="mt-1 text-[15px] text-label-2">{names.data?.get(code) ?? code}</p>

      {building.loading ? (
        <div className="mt-6">
          <ListSkeleton rows={4} />
        </div>
      ) : building.error ? (
        <Message title="Couldn't load this room" text={building.error} />
      ) : !entry || !status ? (
        <Message
          title={`No room “${roomParam}” in ${code}`}
          text="It may not have any classes scheduled this term."
        />
      ) : (
        <>
          <div className="mt-6 rounded-2xl bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p
                className={`text-[22px] font-semibold leading-tight tracking-tight ${HERO_COLORS[status.kind]}`}
              >
                {status.text}
              </p>
              <WhenPicker
                when={when}
                now={now}
                onChange={(w) =>
                  router.replace(
                    `/b/${encodeURIComponent(code)}/${encodeURIComponent(room)}${whenQuery(w)}`,
                    { scroll: false }
                  )
                }
              />
            </div>
            <TimelineBar
              blocks={entry.blocks}
              day={day}
              window={when.mode === "range" ? when : null}
              nowMins={when.mode === "now" ? minutesOf(now) : null}
              className="mt-5"
            />
            <div className="mt-2 flex justify-between text-[11px] text-label-2">
              <span>8 AM</span>
              <span>3 PM</span>
              <span>10 PM</span>
            </div>
          </div>

          <ScheduleView
            key={`${code}-${room}-${day}`}
            blocks={entry.blocks}
            now={now}
            initialDay={day}
          />
        </>
      )}
    </div>
  );
}
