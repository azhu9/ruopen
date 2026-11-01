"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { LuBuilding2, LuDoorOpen, LuSearch, LuStar } from "react-icons/lu";
import ThemeToggle from "./ThemeToggle";

const TABS = [
  { href: "/", label: "Free Rooms", icon: LuDoorOpen },
  { href: "/search", label: "Search", icon: LuSearch },
  { href: "/saved", label: "Saved", icon: LuStar },
];

// Counts client-side page changes so a back button knows whether the
// previous page is part of this app or the user arrived from a link.
let inAppNavigations = 0;

export function useBack(fallback: string) {
  const router = useRouter();
  return () => {
    if (inAppNavigations > 0) router.back();
    else router.push(fallback);
  };
}

function activeTab(pathname: string) {
  if (pathname.startsWith("/search")) return "/search";
  if (pathname.startsWith("/saved")) return "/saved";
  if (pathname === "/") return "/";
  return null;
}

export default function AppNav() {
  const pathname = usePathname();
  const active = activeTab(pathname);

  const previousPath = useRef<string | null>(null);
  useEffect(() => {
    if (previousPath.current !== null && previousPath.current !== pathname) {
      inAppNavigations++;
    }
    previousPath.current = pathname;
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-separator bg-bg/75 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-13 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 rounded-lg">
            <span className="grid size-7 place-items-center rounded-[8px] bg-label text-bg">
              <LuBuilding2 className="size-4" />
            </span>
            <span className="text-[17px] font-semibold tracking-tight">
              RU Open
            </span>
          </Link>

          <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
            {TABS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={active === href ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-colors ${
                  active === href
                    ? "bg-fill text-label"
                    : "text-label-2 hover:text-label"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-separator bg-bg/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 sm:hidden"
      >
        <div className="flex">
          {TABS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={active === href ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2 text-[10.5px] font-medium ${
                active === href ? "text-tint" : "text-label-2"
              }`}
            >
              <Icon className="size-6" strokeWidth={active === href ? 2.25 : 1.75} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
