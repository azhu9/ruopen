"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Meeting } from "../types";
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
    <main className="container">
      <header>
        <h1 className="text-3xl font-bold">
          Rutgers Classroom Schedule Search
        </h1>
        <p>Find out when a class is taking place in a specific room.</p>
      </header>

      <div className="search-form">
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
        <button onClick={searchSchedule} disabled={loading}>
          {loading ? "Searching..." : "Search Schedule"}
        </button>
      </div>

      <div className="results">
        {loading && <p>Loading...</p>}
        {error && <p className="error-message">Error: {error}</p>}

        {/* --- Display logic updated to use the ScheduleView --- */}
        {!loading && !error && hasSearched && (
          <>
            <h2>
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
