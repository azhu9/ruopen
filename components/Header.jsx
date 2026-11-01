import { LuBuilding2 } from "react-icons/lu";
import ThemeToggle from "./ThemeToggle";

export default function Header({ onHome }) {
  return (
    <header className="sticky top-0 z-40 border-b border-separator bg-bg/75 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-13 max-w-5xl items-center justify-between px-4 sm:px-6">
        <a
          href="/"
          onClick={(e) => {
            if (onHome) {
              e.preventDefault();
              onHome();
            }
          }}
          className="flex items-center gap-2.5 rounded-lg"
        >
          <span className="grid size-7 place-items-center rounded-[8px] bg-label text-bg">
            <LuBuilding2 className="size-4" />
          </span>
          <span className="text-[17px] font-semibold tracking-tight">
            RU Open
          </span>
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
