"use client";

import { ClassBlock, DAY_NAMES, formatRange } from "@/lib/schedule";
import Sheet from "./Sheet";

export default function ClassSheet({
  block,
  onClose,
}: {
  block: ClassBlock | null;
  onClose: () => void;
}) {
  return (
    <Sheet
      open={!!block}
      onClose={onClose}
      title={
        block &&
        `${DAY_NAMES[block.day].long} · ${formatRange(block.start, block.end)}`
      }
    >
      <div className="mt-2 divide-y divide-separator">
        {block?.courses.map((c) => (
          <div key={`${c.subject}:${c.course_number}`} className="py-4">
            <h3 className="text-xl font-semibold leading-tight tracking-tight">
              {c.course_title || `${c.subject}:${c.course_number}`}
            </h3>
            <p className="mt-1 text-[15px] text-label-2">
              {c.subject}:{c.course_number}
            </p>
            {(c.instructors.length > 0 || c.sections.length > 0) && (
              <dl className="mt-4 overflow-hidden rounded-xl bg-fill/60 text-[15px]">
                {c.instructors.length > 0 && (
                  <Row label="Instructor" value={c.instructors.join("; ")} />
                )}
                {c.sections.length > 0 && (
                  <Row
                    label={c.sections.length > 1 ? "Sections" : "Section"}
                    value={c.sections.join(", ")}
                  />
                )}
              </dl>
            )}
          </div>
        ))}
      </div>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-separator px-4 py-3 last:border-b-0">
      <dt className="text-label-2">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
