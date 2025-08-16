"use client";

import { Calendar, dateFnsLocalizer, Event } from "react-big-calendar";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Import the base calendar styles first
import "react-big-calendar/lib/css/react-big-calendar.css";
// Then import our custom override styles
import "./ScheduleView.css";

import { Meeting } from "../types";

// Setup for the localizer remains the same...
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// The only changes are inside this function
const transformMeetingsToEvents = (meetings: Meeting[]): Event[] => {
  const groupedMeetings = new Map<string, Meeting & { sections: string[] }>();

  meetings.forEach((meeting) => {
    const key = `${meeting.subject}:${meeting.course_number}:${meeting.meeting_day}:${meeting.start_time}:${meeting.end_time}`;
    if (!groupedMeetings.has(key)) {
      groupedMeetings.set(key, {
        ...meeting,
        sections: [meeting.section_index],
      });
    } else {
      const existingMeeting = groupedMeetings.get(key)!;
      existingMeeting.sections.push(meeting.section_index);
    }
  });

  const events: Event[] = [];
  const today = new Date();
  const dayMapping: { [key: string]: number } = {
    M: 1,
    T: 2,
    W: 3,
    H: 4,
    F: 5,
    S: 6,
    U: 0,
  };

  groupedMeetings.forEach((group) => {
    const dayIndex = dayMapping[group.meeting_day];
    if (dayIndex === undefined) return;

    // --- START: Your New Time Correction Logic ---
    let startHour = parseInt(group.start_time.substring(0, 2));
    const startMinute = parseInt(group.start_time.substring(2, 4));
    let endHour = parseInt(group.end_time.substring(0, 2));
    const endMinute = parseInt(group.end_time.substring(2, 4));

    // Heuristic: If the hour is before 8, it's likely a PM time.
    // (e.g., 2:00 should be 14:00, 5:40 should be 17:40)
    // This handles the data formatting issue.
    if (startHour < 8) {
      startHour += 12;
    }
    if (endHour < 8) {
      endHour += 12;
    }
    // This also helps if a class ends after midnight conceptually (e.g. starts at 10pm ends at 1am), though unlikely for classes.
    // A more robust check might be if (endHour < startHour) but for this use case, the above is safer.
    if (endHour < startHour && startHour > 12) {
      endHour += 12;
    }

    // Corrected syntax with '||' (OR)
    if (startHour == 9 && (startMinute == 20 || startMinute == 35)) {
      startHour += 12;
    }
    // Corrected syntax with '||' (OR)
    if (endHour == 10 && (endMinute == 30 || endMinute == 40)) {
      endHour += 12;
    }
    // --- END: Your New Time Correction Logic ---

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() + dayIndex);
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() - today.getDay() + dayIndex);
    endDate.setHours(endHour, endMinute, 0, 0);

    group.sections.sort();
    const sectionsDisplay = group.sections.join(", ");
    events.push({
      title: `${group.course_title} (Sections: ${sectionsDisplay})`,
      start: startDate,
      end: endDate,
    });
  });
  return events;
};

interface ScheduleViewProps {
  meetings: Meeting[];
}

export default function ScheduleView({ meetings }: ScheduleViewProps) {
  const events = transformMeetingsToEvents(meetings);

  return (
    <div style={{ height: "702px" }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        views={["week"]}
        style={{ margin: "20px 10px" }}
        min={new Date(0, 0, 0, 8, 0, 0)}
        max={new Date(0, 0, 0, 23, 0, 0)}
        toolbar={false}
      />
    </div>
  );
}
