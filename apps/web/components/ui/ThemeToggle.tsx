"use client";

import type { ReactNode } from "react";

import { useTheme, type ThemeMode } from "../../lib/theme/ThemeProvider";

const MODE_ORDER: ThemeMode[] = ["light", "dark", "system"];
const MODE_LABEL: Record<ThemeMode, string> = {
  light: "Light theme",
  dark: "Dark theme",
  system: "System theme",
};

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

const MODE_ICON: Record<ThemeMode, ReactNode> = {
  light: <SunIcon />,
  dark: <MoonIcon />,
  system: <SystemIcon />,
};

/** Icon button that cycles Light → Dark → System → Light on click. */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();

  function cycle() {
    const currentIndex = MODE_ORDER.indexOf(mode);
    const next = MODE_ORDER[(currentIndex + 1) % MODE_ORDER.length] ?? "light";
    setMode(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Theme: ${MODE_LABEL[mode]}. Click to change.`}
      title={MODE_LABEL[mode]}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink/80 transition-colors hover:bg-porcelain-soft hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-deep"
    >
      {MODE_ICON[mode]}
    </button>
  );
}
