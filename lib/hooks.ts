"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

export function useAsync<T>(load: (() => Promise<T>) | null, deps: unknown[]) {
  const [state, setState] = useState<{
    data: T | null;
    error: string | null;
    loading: boolean;
  }>({ data: null, error: null, loading: !!load });

  useEffect(() => {
    if (!load) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, error: null, loading: true }));
    load().then(
      (data) => !cancelled && setState({ data, error: null, loading: false }),
      (err) =>
        !cancelled &&
        setState({
          data: null,
          error: err instanceof Error ? err.message : String(err?.message ?? err),
          loading: false,
        })
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

// The current time, refreshed every 30 seconds.
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// A JSON value in localStorage, shared live between every component using it.
const listeners = new Set<() => void>();
const snapshots = new Map<string, { raw: string | null; value: unknown }>();

function readStored<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {}
  const cachedSnapshot = snapshots.get(key);
  if (cachedSnapshot && cachedSnapshot.raw === raw) return cachedSnapshot.value as T;
  let value: T = fallback;
  try {
    if (raw !== null) value = JSON.parse(raw);
  } catch {}
  snapshots.set(key, { raw, value });
  return value;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useStored<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    subscribe,
    () => readStored(key, fallback),
    () => fallback
  );
  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = readStored(key, fallback);
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      try {
        localStorage.setItem(key, JSON.stringify(resolved));
      } catch {}
      listeners.forEach((l) => l());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );
  return [value, setValue] as const;
}

export interface RoomRef {
  code: string;
  room?: string;
}

const EMPTY: RoomRef[] = [];

export function useSaved() {
  const [saved, setSaved] = useStored<RoomRef[]>("saved-rooms", EMPTY);
  const isSaved = (code: string, room: string) =>
    saved.some((s) => s.code === code && s.room === room);
  const toggle = (code: string, room: string) =>
    setSaved((prev) =>
      prev.some((s) => s.code === code && s.room === room)
        ? prev.filter((s) => !(s.code === code && s.room === room))
        : [{ code, room }, ...prev]
    );
  return { saved, isSaved, toggle };
}

export function useRecents() {
  const [recents, setRecents] = useStored<RoomRef[]>("recent-places", EMPTY);
  const add = useCallback(
    (ref: RoomRef) =>
      setRecents((prev) =>
        [
          ref,
          ...prev.filter((r) => !(r.code === ref.code && r.room === ref.room)),
        ].slice(0, 8)
      ),
    [setRecents]
  );
  const clear = () => setRecents([]);
  return { recents, add, clear };
}
