"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Meeting } from "../types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LuBuilding2 } from "react-icons/lu";

import ScheduleView from "../components/ScheduleView";

export default function HomePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [building, setBuilding] = useState<string>("");
  const [room, setRoom] = useState<string>("");
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // New state for rooms and selected room
  const [rooms, setRooms] = useState<{ room_number: string }[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  const [searchedBuilding, setSearchedBuilding] = useState<string>("");

  const searchSchedule = async () => {
    if (!building) {
      alert("Please provide a building code.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMeetings([]);
      setRooms([]);
      setSelectedRoom(null); // Reset selected room on new search
      setHasSearched(true);

      setSearchedBuilding(building);

      let query = supabase
        .from("class_meetings")
        .select("room_number")
        .ilike("building_code", building.trim());

      // If a room number is provided, filter by it as well
      if (room) {
        query = query.ilike("room_number", room.trim());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      if (data) {
        // Get unique room numbers
        const uniqueRooms = [...new Set(data.map((item) => item.room_number))];

        // --- THIS IS THE NEW LINE ---
        // Sort rooms alphanumerically in ascending order
        uniqueRooms.sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true })
        );

        setRooms(uniqueRooms.map((room_number) => ({ room_number })));
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      if (error) {
        throw error;
      }

      setMeetings(data || []);
      setSelectedRoom(roomNumber);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      <div className="search-form max-w-2xl md:mx-auto mx-8">
        <input
          type="text"
          placeholder="Building Code (e.g., ARC)"
          value={building}
          onChange={(e) => setBuilding(e.target.value.toUpperCase())}
          aria-label="Building "
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
      </div>

      <div className="results max-w-4xl mx-auto">
        {loading && <p>Loading...</p>}
        {error && <p className="error-message">Error: {error}</p>}

        {!loading && !error && hasSearched && (
          <>
            {/* If a room is selected, show the calendar */}
            {selectedRoom ? (
              <div>
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold text-2xl my-4">
                    Schedule for {searchedBuilding} - {selectedRoom}
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
              /* Otherwise, show the table of rooms */
              rooms.length > 0 && (
                <div>
                  <h2 className="font-semibold text-2xl my-4">
                    Eligible Rooms in {searchedBuilding}
                  </h2>
                  <Table>
                    <TableHeader>
                      {/* <TableRow>
                        <TableHead>Room Number</TableHead>
                      </TableRow> */}
                    </TableHeader>
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

            {/* Handle case where no rooms are found for a building */}
            {!selectedRoom && rooms.length === 0 && (
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
