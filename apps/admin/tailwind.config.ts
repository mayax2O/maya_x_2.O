import type { Config } from "tailwindcss";

import sharedPreset from "@maya-x/config/tailwind/preset.cjs";

const config: Config = {
  presets: [sharedPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  // Manual toggle (Light/Dark/System), not the OS-only "media" strategy —
  // ThemeProvider sets data-theme="dark"|"light" on <html> after resolving
  // the user's stored preference (which may itself be "system").
  darkMode: ["selector", '[data-theme="dark"]'],
};

export default config;
