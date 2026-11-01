"use client";

import { useState } from "react";
import { LuChevronRight } from "react-icons/lu";
import { RoomStatus } from "@/lib/schedule";
import StatusLabel from "./StatusLabel";

interface RoomListProps {
  buildingCode: string;
  buildingName: string;
  rooms: { room: string; status: RoomStatus }[];
  onSelect: (room: string) => void;
}

export default function RoomList({
  buildingCode,
  buildingName,
  rooms,
  onSelect,
}: RoomListProps) {
  const [filter, setFilter] = useState<"all" | "free">("all");
  const freeCount = rooms.filter((r) => r.status.free).length;
  const visible = filter === "free" ? rooms.filter((r) => r.status.free) : rooms;

  return (
    <section className="animate-in fade-in-0 duration-300">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h2 className="text-3xl font-semibold tracking-tight">
            {buildingCode}
          </h2>
          {buildingName && (
            <p className="mt-0.5 text-[15px] text-label-2">{buildingName}</p>
          )}
        </div>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `All ${rooms.length}` },
            { value: "free", label: `Free now ${freeCount}` },
          ]}
        />
      </div>

      {visible.length > 0 ? (
        <ul className="mt-5 overflow-hidden rounded-2xl bg-surface shadow-card">
          {visible.map(({ room, status }) => (
            <li key={room} className="group">
              <button
                type="button"
                onClick={() => onSelect(room)}
                className="flex w-full items-center gap-3 pl-4 text-left transition-colors hover:bg-fill/60 active:bg-fill"
              >
                <span className="flex min-h-14 flex-1 items-center justify-between gap-3 border-b border-separator py-3 pr-3 group-last:border-b-0">
                  <span className="text-[17px]">Room {room}</span>
                  <span className="flex items-center gap-2">
                    <StatusLabel status={status} />
                    <LuChevronRight className="size-4 shrink-0 text-label-3" />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 text-center text-[15px] text-label-2">
          Every room in {buildingCode} is in use right now.
        </p>
      )}
    </section>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className = "",
}: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      className={`flex rounded-[10px] bg-fill p-0.5 ${className}`}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 whitespace-nowrap rounded-[8px] px-3 py-1.5 text-[13px] font-medium transition-all ${
              active
                ? "bg-segment text-label shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                : "text-label-2 hover:text-label"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
