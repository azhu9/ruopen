import { Search, DoorOpen, CalendarDays } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search a building",
    text: "Type a code like ARC or a name like Hill Center.",
  },
  {
    icon: DoorOpen,
    title: "Pick a room",
    text: "See which rooms are free right now.",
  },
  {
    icon: CalendarDays,
    title: "Check the schedule",
    text: "Find a gap that fits your study session.",
  },
];

export default function HowTo() {
  return (
    <ol className="mt-14 grid gap-6 sm:mt-20 sm:grid-cols-3 sm:gap-8">
      {steps.map(({ icon: Icon, title, text }) => (
        <li
          key={title}
          className="flex items-start gap-4 sm:flex-col sm:items-center sm:text-center"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-fill text-label-2">
            <Icon className="size-5" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold">{title}</h3>
            <p className="mt-0.5 text-sm leading-snug text-label-2">{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
