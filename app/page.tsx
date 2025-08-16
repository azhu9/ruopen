"use client"; // This is crucial! It marks this as a Client Component.

import { useState } from "react";
import { supabase } from "../lib/supabaseClient"; // Import our client
import { Meeting } from "../types"; // Import our custom type

export default function HomePage() {
  // State management with TypeScript types
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [building, setBuilding] = useState<string>("");
  const [room, setRoom] = useState<string>("");

  const searchSchedule = async () => {
    if (!building || !room) {
      alert("Please provide both a building code and a room number.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMeetings([]); // Clear previous results

      // The Supabase query is strongly typed
      const { data, error } = await supabase
        .from("class_meetings")
        .select("*")
        .ilike("building_code", building.trim()) // Use .trim() to remove whitespace
        .ilike("room_number", room.trim());

      if (error) {
        throw error; // Let the catch block handle it
      }

      // If data is not null, update state, otherwise set to empty array
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
        <h1>Rutgers Classroom Schedule Search</h1>
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

        {!loading && !error && meetings.length > 0 && (
          <div className="meetings-list">
            <h2>
              Schedule for {building} - {room}
            </h2>
            {meetings.map((meeting) => (
              <div key={meeting.id} className="meeting-card">
                <h3>{meeting.course_title}</h3>
                <p>
                  <strong>Course:</strong> {meeting.subject}:
                  {meeting.course_number}
                </p>
                <p>
                  <strong>Schedule:</strong> {meeting.meeting_day} from{" "}
                  {meeting.start_time} to {meeting.end_time}
                </p>
                <p>
                  <strong>Instructor:</strong> {meeting.instructors || "Staff"}
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && meetings.length === 0 && (
          <p>No classes found for this location. Please start a new search.</p>
        )}
      </div>
    </main>
  );
}
