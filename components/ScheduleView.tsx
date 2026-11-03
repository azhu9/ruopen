"use client";

import { useCallback, useMemo, useState } from "react";
import { LuChevronRight } from "react-icons/lu";
import {
  ClassBlock,
  DAY_END,
  DAY_NAMES,
  DAY_START,
  WEEK_ORDER,
  formatDuration,
  formatRange,
  formatTime,
  minutesOf,
} from "@/lib/schedule";
import { scheduleDayOf } from "@/lib/calendar";
import ClassSheet from "./ClassSheet";
import Segmented from "./Segmented";

const HOUR_HEIGHT = 56;

interface ScheduleViewProps {
  blocks: ClassBlock[];
  now: Date;
  initialDay: string;
}

export default function ScheduleView({ blocks, now, initialDay }: ScheduleViewProps) {
  const [openBlock, setOpenBlock] = useState<ClassBlock | null>(null);
  const closeSheet = useCallback(() => setOpenBlock(null), []);
  const [view, setView] = useState<"day" | "week">("day");

  const days = useMemo(
    () =>
      WEEK_ORDER.filter(
        (d) =>
          ["M", "T", "W", "H", "F"].includes(d) ||
          blocks.some((b) => b.day === d)
      ),
    [blocks]
  );

  const today = scheduleDayOf(now);
  const [selectedDay, setSelectedDay] = useState<string>(() =>
    days.includes(initialDay) ? initialDay : "M"
  );

  if (blocks.length === 0) {
    return (
      <div className="mt-6 rounded-2xl bg-surface px-6 py-14 text-center shadow-card">
        <p className="text-lg font-semibold">No classes scheduled</p>
        <p className="mt-1 text-[15px] text-label-2">
          This room is open all week.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 flex items-center justify-between gap-4">
        <h2 className="text-[20px] font-semibold tracking-tight">Schedule</h2>
        <Segmented
          label="Schedule view"
          value={view}
          onChange={setView}
          options={[
            { value: "day", label: "Day" },
            { value: "week", label: "Week" },
          ]}
          className="w-40"
        />
      </div>
      {view === "day" ? (
        <>
          <Segmented
            label="Day"
            value={selectedDay}
            onChange={setSelectedDay}
            options={days.map((d) => ({ value: d, label: DAY_NAMES[d].short }))}
            className="mt-4"
          />
          <DayAgenda
            blocks={blocks.filter((b) => b.day === selectedDay)}
            isToday={selectedDay === today}
            nowMins={minutesOf(now)}
            onOpen={setOpenBlock}
          />
        </>
      ) : (
        <WeekGrid
          blocks={blocks}
          days={days}
          today={today}
          nowMins={minutesOf(now)}
          onOpen={setOpenBlock}
        />
      )}
      <ClassSheet block={openBlock} onClose={closeSheet} />
    </>
  );
}

function courseLabel(block: ClassBlock) {
  const first = block.courses[0];
  return first.course_title || `${first.subject}:${first.course_number}`;
}

function courseCodes(block: ClassBlock) {
  return block.courses.map((c) => `${c.subject}:${c.course_number}`).join(", ");
}

// Lay overlapping blocks side by side.
function layoutDay(dayBlocks: ClassBlock[]) {
  const sorted = [...dayBlocks].sort((a, b) => a.start - b.start || b.end - a.end);
  const placed: { block: ClassBlock; lane: number; lanes: number }[] = [];
  let cluster: { block: ClassBlock; lane: number; lanes: number }[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const item of cluster) item.lanes = laneEnds.length;
    placed.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const block of sorted) {
    if (block.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= block.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(block.end);
    } else {
      laneEnds[lane] = block.end;
    }
    cluster.push({ block, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, block.end);
  }
  flush();
  return placed;
}

function WeekGrid({
  blocks,
  days,
  today,
  nowMins,
  onOpen,
}: {
  blocks: ClassBlock[];
  days: string[];
  today: string;
  nowMins: number;
  onOpen: (b: ClassBlock) => void;
}) {
  const startHour = Math.min(8, Math.floor(Math.min(...blocks.map((b) => b.start)) / 60));
  const endHour = Math.max(18, Math.ceil(Math.max(...blocks.map((b) => b.end)) / 60));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
  const height = (endHour - startHour) * HOUR_HEIGHT;
  const toY = (mins: number) => ((mins - startHour * 60) / 60) * HOUR_HEIGHT;
  const showNow = nowMins >= startHour * 60 && nowMins <= endHour * 60;
  const columns = { gridTemplateColumns: `3.5rem repeat(${days.length}, minmax(0, 1fr))` };

  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-surface shadow-card">
      <div className="grid border-b border-separator" style={columns}>
        <div />
        {days.map((d) => (
          <div
            key={d}
            className={`py-3 text-center text-[13px] font-semibold ${
              d === today ? "text-tint" : "text-label-2"
            }`}
          >
            {DAY_NAMES[d].short}
          </div>
        ))}
      </div>

      <div className="relative grid py-3" style={columns}>
        <div className="relative" style={{ height }}>
          {hours.map((h) => (
            <span
              key={h}
              className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-label-3"
              style={{ top: toY(h * 60) }}
            >
              {formatTime(h * 60).replace(":00", "")}
            </span>
          ))}
        </div>

        {days.map((d) => (
          <div
            key={d}
            className={`relative border-l border-separator ${
              d === today ? "bg-tint-soft/30" : ""
            }`}
            style={{ height }}
          >
            {hours.map((h) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t border-separator"
                style={{ top: toY(h * 60) }}
              />
            ))}

            {layoutDay(blocks.filter((b) => b.day === d)).map(
              ({ block, lane, lanes }) => {
                const top = toY(block.start);
                const h = Math.max(toY(block.end) - top, 22);
                return (
                  <button
                    key={block.key}
                    type="button"
                    onClick={() => onOpen(block)}
                    title={`${courseLabel(block)} · ${formatRange(block.start, block.end)}`}
                    className="absolute overflow-hidden rounded-md border-l-[3px] border-tint bg-tint-soft px-1.5 py-1 text-left text-tint transition-[filter] hover:brightness-95 dark:hover:brightness-125"
                    style={{
                      top: top + 1,
                      height: h - 2,
                      left: `calc(${(lane / lanes) * 100}% + 2px)`,
                      width: `calc(${100 / lanes}% - 4px)`,
                    }}
                  >
                    <p
                      className={`text-[11.5px] font-semibold leading-tight ${
                        h < 52 ? "line-clamp-1" : "line-clamp-2"
                      }`}
                    >
                      {courseLabel(block)}
                    </p>
                    {h >= 40 && (
                      <p className="mt-0.5 truncate text-[10.5px] opacity-75">
                        {formatRange(block.start, block.end)}
                      </p>
                    )}
                  </button>
                );
              }
            )}

            {d === today && showNow && (
              <div
                className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-busy-dot"
                style={{ top: toY(nowMins) }}
              >
                <span className="absolute -left-1 -top-[5px] size-2 rounded-full bg-busy-dot" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type AgendaItem =
  | { kind: "class"; start: number; end: number; block: ClassBlock }
  | { kind: "free"; start: number; end: number };

function DayAgenda({
  blocks,
  isToday,
  nowMins,
  onOpen,
}: {
  blocks: ClassBlock[];
  isToday: boolean;
  nowMins: number;
  onOpen: (b: ClassBlock) => void;
}) {
  const sorted = [...blocks].sort((a, b) => a.start - b.start);
  const items: AgendaItem[] = [];
  let cursor = Math.min(DAY_START, sorted[0]?.start ?? DAY_START);
  for (const block of sorted) {
    if (block.start - cursor >= 10) {
      items.push({ kind: "free", start: cursor, end: block.start });
    }
    items.push({ kind: "class", start: block.start, end: block.end, block });
    cursor = Math.max(cursor, block.end);
  }
  const dayEnd = Math.max(DAY_END, cursor);
  if (dayEnd - cursor >= 10) {
    items.push({ kind: "free", start: cursor, end: dayEnd });
  }

  return (
    <ul className="mt-4 overflow-hidden rounded-2xl bg-surface shadow-card">
      {items.map((item) => {
        const isNow = isToday && item.start <= nowMins && nowMins < item.end;
        const times = (
          <div className="w-[4.5rem] shrink-0 text-[13px] tabular-nums leading-tight">
            <p className="font-medium">{formatTime(item.start)}</p>
            <p className="mt-0.5 text-label-3">{formatTime(item.end)}</p>
          </div>
        );

        if (item.kind === "free") {
          return (
            <li
              key={`free-${item.start}`}
              className="flex items-center gap-3 border-b border-separator px-4 py-3 last:border-b-0"
            >
              {times}
              <div className="flex flex-1 items-center gap-2">
                <span className="size-2 rounded-full bg-ok-dot" />
                <span className="text-[15px] text-ok">Free</span>
                <span className="text-[13px] text-label-3">
                  {formatDuration(item.end - item.start)}
                </span>
              </div>
              {isNow && <NowBadge />}
            </li>
          );
        }

        return (
          <li key={item.block.key} className="border-b border-separator last:border-b-0">
            <button
              type="button"
              onClick={() => onOpen(item.block)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-fill"
            >
              {times}
              <span className="w-[3px] self-stretch rounded-full bg-tint" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium">
                  {courseLabel(item.block)}
                </p>
                <p className="truncate text-[13px] text-label-2">
                  {courseCodes(item.block)}
                </p>
              </div>
              {isNow ? (
                <NowBadge />
              ) : (
                <LuChevronRight className="size-4 shrink-0 text-label-3" />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function NowBadge() {
  return (
    <span className="shrink-0 rounded-full bg-tint px-2 py-0.5 text-[11px] font-semibold text-white">
      Now
    </span>
  );
}
