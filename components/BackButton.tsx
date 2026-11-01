"use client";

import { LuChevronLeft } from "react-icons/lu";
import { useBack } from "./AppNav";

export default function BackButton({
  label,
  fallback,
}: {
  label: string;
  fallback: string;
}) {
  const back = useBack(fallback);
  return (
    <button
      type="button"
      onClick={back}
      className="-ml-1.5 flex items-center gap-0.5 rounded-lg py-1 pr-2 text-[17px] text-tint hover:opacity-80"
    >
      <LuChevronLeft className="size-6" />
      {label}
    </button>
  );
}
