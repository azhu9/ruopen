import { useEffect, useState } from "react";

import { LuMoon, LuSun } from "react-icons/lu";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false); // Default to dark

  // Load preference on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = stored === "dark" || (!stored && true); // fallback to dark
    setIsDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  // Update preference and class
  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(!isDark);

  return (
    <div className="background flex items-center justify-center">
      <label
        htmlFor="AcceptConditions"
        className="relative block h-8 w-14 rounded-full bg-gray-400/40 transition-colors [-webkit-tap-highlight-color:_transparent] peer-checked:bg-green-500 dark:peer-checked:bg-green-600"
      >
        <input
          type="checkbox"
          id="AcceptConditions"
          className="peer sr-only"
          checked={isDark}
          onChange={toggleDarkMode}
        />

        {/* Toggle thumb */}
        <span className="absolute inset-y-0 start-0 m-1 grid size-6 place-content-center rounded-full bg-white text-gray-700 transition-all peer-checked:start-6 dark:bg-gray-900 dark:text-gray-200">
          {isDark ? <LuMoon size={16} /> : <LuSun size={16} />}
        </span>
      </label>
    </div>
  );
};

export default ThemeToggle;
