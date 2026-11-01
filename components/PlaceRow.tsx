import Link from "next/link";
import { LuBuilding2, LuChevronRight, LuClock } from "react-icons/lu";

// A building or recent place in a grouped list.
export default function PlaceRow({
  href,
  title,
  subtitle,
  icon,
}: {
  href: string;
  title: string;
  subtitle?: string;
  icon: "building" | "recent";
}) {
  const Icon = icon === "building" ? LuBuilding2 : LuClock;
  return (
    <li className="group">
      <Link
        href={href}
        className="flex items-center gap-3 pl-4 transition-colors hover:bg-fill/50 active:bg-fill"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fill text-label-2">
          <Icon className="size-4" />
        </span>
        <span className="flex min-h-14 min-w-0 flex-1 items-center gap-3 border-b border-separator py-2.5 pr-3 group-last:border-b-0">
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-medium">{title}</span>
            {subtitle && (
              <span className="block truncate text-[13px] text-label-2">
                {subtitle}
              </span>
            )}
          </span>
          <LuChevronRight className="size-4 shrink-0 text-label-3" />
        </span>
      </Link>
    </li>
  );
}
