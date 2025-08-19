"use client";

import {
  Calendar,
  dateFnsLocalizer,
  Event,
  EventProps,
} from "react-big-calendar";
import { format as formatDate, format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./ScheduleView.css";

// Import your Shadcn Popover components
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Meeting } from "../types";

// 1. Add 'instructor' to the custom event type
interface MyCalendarEvent extends Event {
  subject?: string | null;
  course_number?: string | null;
  course_title?: string | null;
  sections: string[];
  instructor?: string | null; // Added instructor field
}

// Setup for the localizer remains the same...
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format: formatDate,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const transformMeetingsToEvents = (meetings: Meeting[]): MyCalendarEvent[] => {
  const groupedMeetings = new Map<string, Meeting & { sections: string[] }>();

  meetings.forEach((meeting) => {
    if (
      !meeting.subject ||
      !meeting.course_number ||
      !meeting.meeting_day ||
      !meeting.start_time ||
      !meeting.end_time
    ) {
      return;
    }
    const key = `${meeting.subject}:${meeting.course_number}:${meeting.meeting_day}:${meeting.start_time}:${meeting.end_time}`;
    if (!groupedMeetings.has(key)) {
      groupedMeetings.set(key, {
        ...meeting,
        sections: [meeting.section_index].filter(
          (s): s is string => s !== null
        ),
      });
    } else {
      const existingMeeting = groupedMeetings.get(key)!;
      if (meeting.section_index) {
        existingMeeting.sections.push(meeting.section_index);
      }
    }
  });

  const events: MyCalendarEvent[] = [];
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
    if (!group.meeting_day || !group.start_time || !group.end_time) {
      return;
    }

    const dayIndex = dayMapping[group.meeting_day];
    if (dayIndex === undefined) return;

    let startHour = parseInt(group.start_time.substring(0, 2));
    const startMinute = parseInt(group.start_time.substring(2, 4));
    let endHour = parseInt(group.end_time.substring(0, 2));
    const endMinute = parseInt(group.end_time.substring(2, 4));

    if (startHour < 8) startHour += 12;
    if (endHour < 8) endHour += 12;
    if (endHour < startHour && startHour > 12) endHour += 12;
    if (startHour === 9 && (startMinute === 20 || startMinute === 35))
      startHour += 12;
    if (endHour === 10 && (endMinute === 30 || endMinute === 40)) endHour += 12;

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() + dayIndex);
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(today.getDate() - today.getDay() + dayIndex);
    endDate.setHours(endHour, endMinute, 0, 0);

    group.sections.sort();

    // 2. Add the instructor property when creating the event object
    events.push({
      title: `${group.subject}:${group.course_number} - ${group.course_title}`,
      start: startDate,
      end: endDate,
      subject: group.subject,
      course_number: group.course_number,
      course_title: group.course_title,
      sections: group.sections,
      instructor: group.instructors, // Pass instructor data here
    });
  });
  return events;
};

// 3. Render the instructor information in the popover
const CustomEvent = ({ event }: EventProps<MyCalendarEvent>) => {
  const startTime = event.start ? format(event.start, "p") : "";
  const endTime = event.end ? format(event.end, "p") : "";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="cursor-pointer">
          <div className="font-semibold">{event.course_title}</div>
          <p>
            {event.subject}:{event.course_number}
          </p>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80" onClick={(e) => e.stopPropagation()}>
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-bold leading-none">{event.course_title}</h4>
            <p className="text-sm">
              {event.subject}:{event.course_number}
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-semibold">Time:</span>
              <span className="col-span-2">
                {startTime} - {endTime}
              </span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <span className="font-semibold">Sections:</span>
              <span className="col-span-2">{event.sections.join(", ")}</span>
            </div>
            {/* --- NEWLY ADDED BLOCK --- */}
            {/* This will only render if the instructor field has a value */}
            {event.instructor && (
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold">Instructor:</span>
                <span className="col-span-2">{event.instructor}</span>
              </div>
            )}
            {/* --- END OF NEW BLOCK --- */}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
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
        formats={{
          dayFormat: (date, culture) => localizer.format(date, "EEE", culture),
          weekdayFormat: (date, culture) =>
            localizer.format(date, "EEE", culture),
        }}
        components={{
          event: CustomEvent,
        }}
        onSelectEvent={(event, e) => e.stopPropagation()}
      />
    </div>
  );
}
