"use client";

import { useEffect, useState } from "react";
import { LuLock, LuShare } from "react-icons/lu";
import { alreadyReported, reportLocked } from "@/lib/reports";

export function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share room"
      className="relative grid size-10 place-items-center rounded-full text-label-2 transition-colors hover:bg-fill hover:text-label"
    >
      <LuShare className="size-[20px]" />
      {copied && (
        <span className="absolute top-full right-0 mt-1 whitespace-nowrap rounded-lg bg-label px-2.5 py-1 text-[12px] font-medium text-bg animate-in fade-in-0">
          Link copied
        </span>
      )}
    </button>
  );
}

export function LockedReport({
  code,
  room,
  count,
}: {
  code: string;
  room: string;
  count: number;
}) {
  const [state, setState] = useState<"idle" | "confirm" | "sending" | "sent" | "error">(
    "idle"
  );
  useEffect(() => {
    if (alreadyReported(code, room)) setState("sent");
  }, [code, room]);

  const [justSent, setJustSent] = useState(false);
  const send = async () => {
    setState("sending");
    try {
      await reportLocked(code, room);
      setJustSent(true);
      setState("sent");
    } catch {
      setState("error");
    }
  };

  const shownCount = count + (justSent ? 1 : 0);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1 text-[13px]">
      <span className={`flex items-center gap-1.5 ${shownCount ? "text-partial" : "text-label-2"}`}>
        <LuLock className="size-3.5" />
        {shownCount
          ? `Reported locked ${shownCount === 1 ? "once" : `${shownCount} times`} this week`
          : "No locked reports this week"}
      </span>
      {state === "idle" && (
        <button type="button" onClick={() => setState("confirm")} className="text-tint">
          Was it locked?
        </button>
      )}
      {state === "confirm" && (
        <span className="flex items-center gap-3">
          <span className="text-label-2">Report it as locked?</span>
          <button type="button" onClick={send} className="font-semibold text-tint">
            Report
          </button>
          <button type="button" onClick={() => setState("idle")} className="text-label-2">
            Cancel
          </button>
        </span>
      )}
      {state === "sending" && <span className="text-label-2">Sending…</span>}
      {state === "sent" && <span className="text-label-2">Thanks for reporting</span>}
      {state === "error" && (
        <span className="text-label-2">Couldn&apos;t send the report. Try again later.</span>
      )}
    </div>
  );
}
