import type { Config } from "tailwindcss";

import sharedPreset from "@maya-x/config/tailwind/preset.cjs";

const config: Config = {
  presets: [sharedPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  darkMode: "media",
};

export default config;
