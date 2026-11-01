"use client";

import { useEffect } from "react";
import { LuX } from "react-icons/lu";
import { ClassBlock, DAY_NAMES, formatRange } from "@/lib/schedule";

// Bottom sheet on phones, centered card on larger screens.
export default function ClassSheet({
  block,
  onClose,
}: {
  block: ClassBlock | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!block) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [block, onClose]);

  if (!block) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 dark:bg-black/60 animate-in fade-in-0 duration-200 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Class details"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-surface px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2.5 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 sm:max-w-md sm:rounded-3xl sm:pb-6 sm:pt-5 sm:slide-in-from-bottom-0 sm:zoom-in-95"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-fill sm:hidden" />
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-medium text-label-2">
            {DAY_NAMES[block.day].long} · {formatRange(block.start, block.end)}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-full bg-fill text-label-2 hover:text-label"
          >
            <LuX className="size-4" />
          </button>
        </div>

        <div className="mt-2 divide-y divide-separator">
          {block.courses.map((c) => (
            <div key={`${c.subject}:${c.course_number}`} className="py-4">
              <h3 className="text-xl font-semibold leading-tight tracking-tight">
                {c.course_title || `${c.subject}:${c.course_number}`}
              </h3>
              <p className="mt-1 text-[15px] text-label-2">
                {c.subject}:{c.course_number}
              </p>
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
            </div>
          ))}
        </div>
      </div>
    </div>
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
