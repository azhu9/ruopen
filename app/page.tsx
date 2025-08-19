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
  // TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// --- MODIFIED: Import the 'LuX' icon ---
import { LuBuilding2, LuX } from "react-icons/lu";
import ScheduleView from "../components/ScheduleView";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  const fetchBuildingSuggestions = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }
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
    }
  };

  const handleBuildingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBuilding(value);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchBuildingSuggestions(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: BuildingSuggestion) => {
    setBuilding(suggestion.building_code);
    setSuggestions([]);
  };

  const searchSchedule = async () => {
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

  return (
    <main className="">
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className=" mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <LuBuilding2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">RU Open</h1>
              <p className="text-sm text-muted-foreground">
                Find your perfect study space
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="text-center mb-12 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Discover Available Study Classrooms
        </h2>
        <p className="text-lg text-gray-500 mb-8">
          Search for available classrooms and study spaces across <br /> Rutgers
          University New Brunswick
        </p>
      </div>

      <div className="search-form max-w-2xl md:mx-auto mx-8 relative">
        <input
          type="text"
          placeholder="Building Code or Name (e.g., ARC)"
          value={building}
          onChange={handleBuildingChange}
          aria-label="Building "
          autoComplete="off"
        />
        <input
          type="text"
          placeholder="Room Number (e.g., 105)"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          aria-label="Room Number"
        />
        <Button
          onClick={searchSchedule}
          disabled={loading}
          className="px-3 py-6"
          variant="outline"
        >
          {loading ? "Searching..." : "Search Room"}
        </Button>

        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-10">
            <ul>
              {suggestions.map((s, index) => (
                <li
                  key={s.building_code}
                  className={`px-4 py-2 cursor-pointer hover:bg-muted ${
                    index > 0 ? "border-t border-border" : ""
                  }`}
                  onClick={() => handleSuggestionClick(s)}
                >
                  <p className="font-semibold">{s.building_code}</p>
                  <p className="text-sm text-muted-foreground">{s.full_name}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* --- MODIFIED: Alert component with a close button --- */}
      <div className="max-w-2xl md:mx-auto mx-8 mt-4">
        {alertInfo && (
          <div className="relative">
            <Alert className="pr-12">
              {" "}
              {/* Add padding to make space for the button */}
              <AlertTitle>{alertInfo.title}</AlertTitle>
              <AlertDescription>{alertInfo.description}</AlertDescription>
            </Alert>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-3 -translate-y-1/2 h-6 w-6" // Position button
              onClick={() => setAlertInfo(null)}
            >
              <LuX className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        )}
      </div>

      <div className="results max-w-4xl mx-auto">
        {loading && <p>Loading...</p>}
        {error && <p className="error-message">Error: {error}</p>}

        {!loading && !error && hasSearched && (
          <>
            {selectedRoom ? (
              <div>
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-2xl my-4">
                    Schedule for {buildingFullName || searchedBuilding} -{" "}
                    {selectedRoom}
                  </h2>
                  <Button onClick={handleBackToRooms} variant="outline">
                    Back to Room List
                  </Button>
                </div>

                {meetings.length > 0 ? (
                  <ScheduleView meetings={meetings} />
                ) : (
                  <p>No classes scheduled for this room.</p>
                )}
              </div>
            ) : (
              rooms.length > 0 && (
                <div>
                  <h2 className="font-semibold text-2xl my-4">
                    Eligible Rooms in {buildingFullName || searchedBuilding}
                  </h2>
                  <Table>
                    <TableHeader></TableHeader>
                    <TableBody>
                      {rooms.map((r) => (
                        <TableRow
                          key={r.room_number}
                          onClick={() => fetchMeetingsForRoom(r.room_number)}
                          className="cursor-pointer"
                        >
                          <TableCell className="font-medium text-md">
                            {searchedBuilding} - {r.room_number}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            )}

            {!selectedRoom && hasSearched && rooms.length === 0 && (
              <p className="text-center mt-8">
                No rooms found for this building.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
