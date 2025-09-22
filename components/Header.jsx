import { LuBuilding2 } from "react-icons/lu";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/80 dark:bg-[#1b1b1b]/80  backdrop-blur-sm shadow-lg border-b m-8 max-w-5xl lg:mx-auto rounded-full ">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <LuBuilding2 className="w-5 h-5 text-white dark:text-black" />
            </div>
            <h1 className="text-xl font-semibold text-black dark:text-white self-center ">
              RU Open
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
