"use client";

import { useEffect } from "react";
import { LuX } from "react-icons/lu";

// Bottom sheet on phones, centered card on larger screens.
export default function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 animate-in fade-in-0 duration-200 dark:bg-black/60 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl bg-surface px-5 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-2.5 shadow-2xl animate-in slide-in-from-bottom-8 duration-300 sm:max-w-md sm:rounded-3xl sm:pb-6 sm:pt-5 sm:slide-in-from-bottom-0 sm:zoom-in-95"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-fill sm:hidden" />
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 text-[13px] font-medium text-label-2">
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-fill text-label-2 hover:text-label"
          >
            <LuX className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
