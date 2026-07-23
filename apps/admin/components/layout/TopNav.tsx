"use client";

import { ThemeToggle } from "../ui/ThemeToggle";
import { Breadcrumbs } from "./Breadcrumbs";
import { NotificationsMenu } from "./NotificationsMenu";
import { ProfileMenu } from "./ProfileMenu";

export function TopNav({
  onOpenCommandPalette,
  onToggleSidebar,
  onOpenMobileDrawer,
}: {
  onOpenCommandPalette: () => void;
  onToggleSidebar: () => void;
  onOpenMobileDrawer: () => void;
}) {
  return (
    <header className="flex h-16 items-center gap-3 border-b border-white/10 bg-ink px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileDrawer}
        aria-label="Open navigation menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-porcelain/70 hover:bg-white/5 lg:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="h-5 w-5"
        >
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className="hidden h-9 w-9 items-center justify-center rounded-md text-porcelain/70 hover:bg-white/5 lg:inline-flex"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="h-5 w-5"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
        </svg>
      </button>

      <div className="flex-1">
        <Breadcrumbs />
      </div>

      <button
        type="button"
        onClick={onOpenCommandPalette}
        className="hidden items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-[13px] text-porcelain/60 hover:bg-white/5 sm:inline-flex"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M20 20l-4.5-4.5" />
        </svg>
        Search
        <kbd className="rounded border border-white/20 px-1.5 py-0.5 text-[11px]">
          Ctrl K
        </kbd>
      </button>

      <ThemeToggle />
      <NotificationsMenu />
      <ProfileMenu />
    </header>
  );
}
