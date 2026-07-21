import type { Config } from "tailwindcss";

import sharedPreset from "@maya-x/config/tailwind/preset.cjs";

const config: Config = {
  presets: [sharedPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    // Shared component library ships TS source and is consumed directly —
    // its class names must be scanned here too, or Tailwind purges them.
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  darkMode: "media",
};

export default config;
