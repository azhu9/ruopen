import Link from "next/link";
import { LuChevronRight, LuLock } from "react-icons/lu";
import { ClassBlock, minutesOf } from "@/lib/schedule";
import { Availability, When, whenDay, whenQuery } from "@/lib/when";
import StatusLabel from "./StatusLabel";
import TimelineBar from "./TimelineBar";

export function roomHref(code: string, room: string, when: When) {
  return `/b/${encodeURIComponent(code)}/${encodeURIComponent(room)}${whenQuery(when)}`;
}

// One tappable room in a grouped list: name, availability and a day timeline.
export default function RoomRow({
  code,
  room,
  blocks,
  status,
  when,
  now,
  showBuilding = false,
  reports = 0,
}: {
  code: string;
  room: string;
  blocks: ClassBlock[];
  status: Availability;
  when: When;
  now: Date;
  showBuilding?: boolean;
  reports?: number;
}) {
  return (
    <li className="group">
      <Link
        href={roomHref(code, room, when)}
        className="flex items-center gap-3 pl-4 transition-colors hover:bg-fill/50 active:bg-fill"
      >
        <span className="flex min-w-0 flex-1 items-center gap-3 border-b border-separator py-3 pr-3 group-last:border-b-0">
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-[17px]">
                  {showBuilding ? `${code} ${room}` : `Room ${room}`}
                </span>
                {reports > 0 && (
                  <LuLock
                    className="size-3.5 shrink-0 text-partial"
                    aria-label={`Reported locked ${reports} ${reports === 1 ? "time" : "times"} this week`}
                  />
                )}
              </span>
              <StatusLabel status={status} className="shrink-0 text-right" />
            </span>
            <TimelineBar
              blocks={blocks}
              day={whenDay(when, now)}
              window={when.mode === "range" ? when : null}
              nowMins={when.mode === "now" ? minutesOf(now) : null}
              className="mt-2.5"
            />
          </span>
          <LuChevronRight className="size-4 shrink-0 text-label-3" />
        </span>
      </Link>
    </li>
  );
}
