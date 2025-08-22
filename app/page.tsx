/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { Meeting } from "../types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LuBuilding2, LuX } from "react-icons/lu";
import { HiOutlineArrowTurnUpLeft } from "react-icons/hi2";

import HowTo from "@/components/HowTo";
import ScheduleView from "@/components/ScheduleView";
import Footer from "@/components/Footer";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface BuildingSuggestion {
  building_code: string;
  full_name: string;
}

export default function HomePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [building, setBuilding] = useState<string>("");
  const [room, setRoom] = useState<string>("");
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const [rooms, setRooms] = useState<{ room_number: string }[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const [searchedBuilding, setSearchedBuilding] = useState<string>("");
  const [buildingFullName, setBuildingFullName] = useState<string>("");

  const [suggestions, setSuggestions] = useState<BuildingSuggestion[]>([]);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const [alertInfo, setAlertInfo] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ROOMS_PER_PAGE = 8;

  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const fetchBuildingSuggestions = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }
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

      const getScore = (item: BuildingSuggestion, term: string): number => {
        const code = item.building_code.toUpperCase();
        const name = item.full_name.toUpperCase();
        term = term.toUpperCase();

        if (code.startsWith(term)) return 1;
        if (name.startsWith(term)) return 2;
        return 3;
      };

      const sortedData = (data || []).sort((a, b) => {
        const scoreA = getScore(a, searchTerm);
        const scoreB = getScore(b, searchTerm);
        return scoreA - scoreB;
      });

      setSuggestions(sortedData.slice(0, 5));
    } catch (error) {
      console.error("Error fetching building suggestions:", error);
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleBuildingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBuilding(value);

    if (value.length >= 2) {
      setIsSuggestionsVisible(true);
    } else {
      setIsSuggestionsVisible(false);
      setSuggestions([]);
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      // Ensure value is still long enough before fetching
      if (value.length >= 2) {
        fetchBuildingSuggestions(value);
      }
    }, 100);
  };
  const handleSuggestionClick = (suggestion: BuildingSuggestion) => {
    setBuilding(suggestion.building_code);
    setSuggestions([]);
    setIsSuggestionsVisible(false);
  };

  const searchSchedule = async () => {
    setIsSuggestionsVisible(false);
    setAlertInfo(null);

    if (!building) {
      setAlertInfo({
        title: "Heads up!",
        description: "Please provide a building code or name to search.",
      });
      return;
    }

    setSuggestions([]);

    try {
      setLoading(true);
      setError(null);
      setMeetings([]);
      setRooms([]);
      setSelectedRoom(null);
      setHasSearched(true);
      // --- MODIFIED: Reset to page 1 on new search ---
      setCurrentPage(1);

      const buildingCode = building.toUpperCase().trim();
      setBuildingFullName("");
      setSearchedBuilding(buildingCode);

      let roomQuery = supabase
        .from("class_meetings")
        .select("room_number")
        .ilike("building_code", buildingCode);

      if (room) {
        roomQuery = roomQuery.ilike("room_number", room.trim());
      }

      const { data: roomData, error: roomError } = await roomQuery;

      if (roomError) throw roomError;

      if (roomData && roomData.length > 0) {
        const uniqueRooms = [
          ...new Set(roomData.map((item) => item.room_number)),
        ];
        uniqueRooms.sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true })
        );
        setRooms(uniqueRooms.map((room_number) => ({ room_number })));

        const { data: buildingNameData, error: buildingNameError } =
          await supabase
            .from("building_codes")
            .select("full_name")
            .ilike("building_code", buildingCode)
            .maybeSingle();

        if (buildingNameError) {
          console.error(
            "Could not fetch building full name:",
            buildingNameError.message
          );
        } else if (buildingNameData) {
          setBuildingFullName(buildingNameData.full_name);
        }
      } else {
        setRooms([]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetingsForRoom = async (roomNumber: string) => {
    try {
      setLoading(true);
      setError(null);
      setMeetings([]);

      const { data, error } = await supabase
        .from("class_meetings")
        .select("*")
        .ilike("building_code", searchedBuilding.trim())
        .ilike("room_number", roomNumber);

      if (error) throw error;

      setMeetings(data || []);
      setSelectedRoom(roomNumber);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToRooms = () => {
    setSelectedRoom(null);
    setMeetings([]);
  };

  // --- MODIFIED: Pagination logic ---
  const totalPages = Math.ceil(rooms.length / ROOMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROOMS_PER_PAGE;
  const endIndex = startIndex + ROOMS_PER_PAGE;
  const currentRooms = rooms.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Optional: scroll to top on page change
  };

  return (
    <main className="flex flex-col bg-gray-50">
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <LuBuilding2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  RU Open
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative isolate overflow-hidden bg-gradient-to-b from-indigo-100/20 pt-14">
        <div
          className="absolute inset-y-0 right-1/2 -z-10 -mr-96 w-[200%] origin-top-right skew-x-[-30deg] bg-white shadow-xl shadow-indigo-600/10 ring-1 ring-indigo-50 sm:-mr-80 lg:-mr-96"
          aria-hidden="true"
        />
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Discover Your Perfect Study Space
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Search for available classrooms and study spaces across Rutgers
              University-New Brunswick.
            </p>
          </div>
        </div>
      </div>

      <div className="search-form -mt-16 sm:-mt-20 lg:-mt-24 max-w-2xl md:mx-auto mx-8 relative">
        <div className="relative">
          <div className="flex items-center bg-white rounded-lg shadow-lg p-3 gap-2">
            <input
              type="text"
              placeholder="Building Code or Name (e.g., ARC)"
              value={building}
              onChange={handleBuildingChange}
              aria-label="Building"
              autoComplete="off"
              className="flex-grow p-2 text-lg bg-transparent focus:outline-none"
            />
            <input
              type="text"
              placeholder="Room (e.g., 105)"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              aria-label="Room Number"
              className="w-36 p-2 text-lg bg-transparent focus:outline-none"
            />
            <Button
              onClick={searchSchedule}
              disabled={loading}
              className="px-6 py-6 text-lg rounded-sm"
            >
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>
          {isSuggestionsVisible && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              {suggestionsLoading ? (
                <p className="px-4 py-3 text-sm text-gray-500">Searching...</p>
              ) : suggestions.length > 0 ? (
                <ul>
                  {suggestions.map((s, index) => (
                    <li
                      key={s.building_code}
                      className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                        index > 0 ? "border-t border-gray-200" : ""
                      }`}
                      onClick={() => handleSuggestionClick(s)}
                    >
                      <p className="font-semibold">{s.building_code}</p>
                      <p className="text-sm text-gray-500">{s.full_name}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-3 text-sm text-gray-500">
                  No buildings found.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl md:mx-auto mx-8 mt-4">
        {alertInfo && (
          <div className="relative">
            <Alert className="pr-12">
              <AlertTitle>{alertInfo.title}</AlertTitle>
              <AlertDescription>{alertInfo.description}</AlertDescription>
            </Alert>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-3 -translate-y-1/2 h-6 w-6"
              onClick={() => setAlertInfo(null)}
            >
              <LuX className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        )}
      </div>
      {!hasSearched && <HowTo />}

      <div className="results w-4xl mx-auto mt-12 mb-20 px-4 sm:px-6 lg:px-8">
        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}

        {!loading && !error && hasSearched && (
          <>
            {selectedRoom ? (
              <div>
                <div className="flex justify-between gap-4 mb-6 flex-col">
                  <Button
                    onClick={handleBackToRooms}
                    variant="outline"
                    className="w-16"
                  >
                    <HiOutlineArrowTurnUpLeft />
                  </Button>
                  <h2 className="font-semibold text-2xl">
                    {buildingFullName || searchedBuilding} - Room {selectedRoom}
                  </h2>
                </div>
                {meetings.length > 0 ? (
                  <ScheduleView meetings={meetings} />
                ) : (
                  <p className="text-center text-gray-500 mt-8">
                    No classes scheduled for this room. It&apos;s available all
                    day!
                  </p>
                )}
              </div>
            ) : (
              rooms.length > 0 && (
                <div>
                  <h2 className="font-semibold text-2xl my-4 text-center">
                    Available Rooms in {buildingFullName || searchedBuilding}
                  </h2>
                  <div className="border rounded-lg overflow-hidden mt-4 w-2xl mx-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {/* You can add table headers if needed */}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* --- MODIFIED: Map over currentRooms for pagination --- */}
                        {currentRooms.map((r) => (
                          <TableRow
                            key={r.room_number}
                            onClick={() => fetchMeetingsForRoom(r.room_number)}
                            className="cursor-pointer hover:bg-gray-100"
                          >
                            <TableCell className="font-medium text-md p-4">
                              Room {r.room_number}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* --- MODIFIED: Add Pagination component --- */}
                  {totalPages > 1 && (
                    <Pagination className="mt-6">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(Math.max(currentPage - 1, 1));
                            }}
                            aria-disabled={currentPage === 1}
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(page);
                              }}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(
                                Math.min(currentPage + 1, totalPages)
                              );
                            }}
                            aria-disabled={currentPage === totalPages}
                            className={
                              currentPage === totalPages
                                ? "pointer-events-none opacity-50"
                                : ""
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              )
            )}
            {!selectedRoom && hasSearched && rooms.length === 0 && (
              <p className="text-center text-gray-500 mt-8">
                No rooms found for this building or specific room number.
              </p>
            )}
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
