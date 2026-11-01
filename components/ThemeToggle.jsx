import { useEffect, useState } from "react";

import { LuMoon, LuSun } from "react-icons/lu";

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  // The inline script in layout.tsx already applied the theme; sync with it
  // and keep following the system setting until the user picks one.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = (e) => {
      let stored = null;
      try {
        stored = localStorage.getItem("theme");
      } catch {}
      if (stored) return;
      document.documentElement.classList.toggle("dark", e.matches);
      setIsDark(e.matches);
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, []);

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid size-9 place-items-center rounded-full text-label-2 transition-colors hover:bg-fill hover:text-label"
    >
      {isDark ? <LuSun size={18} /> : <LuMoon size={18} />}
    </button>
  );
};

export default ThemeToggle;
