"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Meeting } from "../types";
import { Button } from "@/components/ui/button";
import { LuBuilding2 } from "react-icons/lu";

import ScheduleView from "../components/ScheduleView"; // Import the new component

export default function HomePage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [building, setBuilding] = useState<string>("");
  const [room, setRoom] = useState<string>("");
  const [hasSearched, setHasSearched] = useState<boolean>(false); // Track if a search has been performed

  const searchSchedule = async () => {
    if (!building || !room) {
      alert("Please provide both a building code and a room number.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMeetings([]);
      setHasSearched(true); // Mark that a search was made

      const { data, error } = await supabase
        .from("class_meetings")
        .select("*")
        .ilike("building_code", building.trim())
        .ilike("room_number", room.trim());

      if (error) {
        throw error;
      }

      setMeetings(data || []);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        <p className="text-lg text-muted-foreground mb-8">
          Search for available classrooms and study spaces across Rutgers
          University campus. Enter a building code and room number to get
          real-time availability.
        </p>
      </div>

      <div className="search-form max-w-2xl md:mx-auto mx-8">
        <input
          type="text"
          placeholder="Building Code (e.g., ARC)"
          value={building}
          onChange={(e) => setBuilding(e.target.value.toUpperCase())}
          aria-label="Building Code"
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
        >
          {loading ? "Searching..." : "Search Room"}
        </Button>
      </div>

      <div className="results max-w-4xl mx-auto">
        {loading && <p>Loading...</p>}
        {error && <p className="error-message">Error: {error}</p>}

        {/* --- Display logic updated to use the ScheduleView --- */}
        {!loading && !error && hasSearched && (
          <>
            <h2 className="font-semibold text-2xl">
              Schedule for {building} - {room}
            </h2>
            {meetings.length > 0 ? (
              <ScheduleView meetings={meetings} />
            ) : (
              <p>No classes found for this location.</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
