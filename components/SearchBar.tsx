"use client";

import { useEffect, useRef, useState } from "react";
import { LuSearch, LuCircleX } from "react-icons/lu";
import { supabase } from "@/lib/supabaseClient";

interface BuildingSuggestion {
  building_code: string;
  full_name: string;
}

interface SearchBarProps {
  building: string;
  room: string;
  onBuildingChange: (value: string) => void;
  onRoomChange: (value: string) => void;
  onSearch: (buildingCode?: string) => void;
  loading: boolean;
}

export default function SearchBar({
  building,
  room,
  onBuildingChange,
  onRoomChange,
  onSearch,
  loading,
}: SearchBarProps) {
  const [suggestions, setSuggestions] = useState<BuildingSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const requestId = useRef(0);
  const buildingInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);

  const fetchBuildingSuggestions = async (searchTerm: string) => {
    const id = ++requestId.current;
    setSuggestionsLoading(true);
    try {
      const { data, error } = await supabase
        .from("building_codes")
        .select("building_code, full_name")
        .or(
          `building_code.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`
        )
        .limit(10);

      if (error) throw error;
      if (id !== requestId.current) return;

      const term = searchTerm.toUpperCase();
      const getScore = (item: BuildingSuggestion): number => {
        const code = item.building_code.toUpperCase();
        const name = item.full_name.toUpperCase();
        if (code === term) return 0;
        if (code.startsWith(term)) return 1;
        if (name.startsWith(term)) return 2;
        return 3;
      };

      const sorted = (data || []).sort((a, b) => getScore(a) - getScore(b));
      setSuggestions(sorted.slice(0, 5));
      setActiveIndex(sorted.length > 0 ? 0 : -1);
    } catch (error) {
      console.error("Error fetching building suggestions:", error);
      if (id === requestId.current) setSuggestions([]);
    } finally {
      if (id === requestId.current) setSuggestionsLoading(false);
    }
  };

  const handleBuildingChange = (value: string) => {
    onBuildingChange(value);

    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    if (value.trim().length >= 2) {
      setIsOpen(true);
      debounceTimeout.current = setTimeout(
        () => fetchBuildingSuggestions(value.trim()),
        100
      );
    } else {
      requestId.current++;
      setIsOpen(false);
      setSuggestions([]);
      setActiveIndex(-1);
    }
  };

  const closeSuggestions = () => {
    requestId.current++;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    setIsOpen(false);
    setSuggestionsLoading(false);
  };

  const selectSuggestion = (suggestion: BuildingSuggestion) => {
    onBuildingChange(suggestion.building_code);
    setSuggestions([]);
    closeSuggestions();
    onSearch(suggestion.building_code);
  };

  const submit = () => {
    closeSuggestions();
    buildingInput.current?.blur();
    onSearch();
  };

  const handleBuildingKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const open = isOpen && suggestions.length > 0;
    if (e.key === "ArrowDown" && open) {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && open) {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      closeSuggestions();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && activeIndex >= 0 && !suggestionsLoading) {
        selectSuggestion(suggestions[activeIndex]);
      } else {
        submit();
      }
    }
  };

  return (
    <div className="relative">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="flex flex-col rounded-2xl bg-surface p-1.5 shadow-card sm:flex-row sm:items-center"
      >
        <label className="flex min-w-0 flex-1 items-center gap-2.5 px-3">
          <LuSearch className="size-[18px] shrink-0 text-label-3" />
          <input
            ref={buildingInput}
            type="text"
            inputMode="search"
            enterKeyHint="search"
            placeholder="Building, e.g. ARC"
            value={building}
            onChange={(e) => handleBuildingChange(e.target.value)}
            onKeyDown={handleBuildingKeyDown}
            onBlur={closeSuggestions}
            aria-label="Building"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls="building-suggestions"
            aria-activedescendant={
              isOpen && activeIndex >= 0
                ? `building-option-${activeIndex}`
                : undefined
            }
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="h-12 min-w-0 flex-1 bg-transparent text-[17px] placeholder:text-label-3 focus:outline-none"
          />
          {building && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                handleBuildingChange("");
                buildingInput.current?.focus();
              }}
              aria-label="Clear building"
              className="text-label-3 hover:text-label-2"
            >
              <LuCircleX className="size-[18px]" />
            </button>
          )}
        </label>

        <div className="mx-3 h-px bg-separator sm:mx-0 sm:h-7 sm:w-px" />

        <label className="flex items-center px-3 sm:w-44">
          <input
            type="text"
            inputMode="text"
            enterKeyHint="search"
            placeholder="Room (optional)"
            value={room}
            onChange={(e) => onRoomChange(e.target.value)}
            aria-label="Room number"
            autoComplete="off"
            spellCheck={false}
            className="h-12 w-full bg-transparent text-[17px] placeholder:text-label-3 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-1.5 h-11 rounded-xl bg-tint px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50 sm:mt-0"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {isOpen && (
        <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-separator bg-surface shadow-card animate-in fade-in-0 slide-in-from-top-1 duration-150 dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
          {suggestionsLoading && suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-label-2">Searching…</p>
          ) : suggestions.length > 0 ? (
            <ul id="building-suggestions" role="listbox">
              {suggestions.map((s, index) => (
                <li
                  key={s.building_code}
                  id={`building-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectSuggestion(s)}
                  className={`flex cursor-pointer items-baseline gap-3 px-4 py-3 ${
                    index === activeIndex ? "bg-fill" : ""
                  }`}
                >
                  <span className="w-14 shrink-0 font-semibold">
                    {s.building_code}
                  </span>
                  <span className="truncate text-sm text-label-2">
                    {s.full_name}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-label-2">
              No buildings found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
