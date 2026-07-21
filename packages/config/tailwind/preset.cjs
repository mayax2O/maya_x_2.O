/**
 * Shared Tailwind preset — encodes the tokens from the approved MAYA_X_2.0
 * Design System (color palette, type stacks) so `apps/web` and `apps/admin`
 * never hand-roll the same values. Consumed via `presets: [require("@maya-x/config/tailwind/preset.cjs")]`
 * in each app's tailwind.config.ts.
 *
 * Decision: Tailwind v3 (classic JS config), not v4. v4's CSS-first config
 * has no stable "shared preset" story yet across multiple apps in one
 * monorepo — v3's `presets` array is the well-established mechanism for
 * exactly this use case.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        ink: "#12141c",
        "ink-soft": "#1c1f29",
        "ink-softer": "#262a37",
        porcelain: "#f3f4f6",
        "porcelain-soft": "#e8e9ed",
        brass: {
          DEFAULT: "#b8894a",
          deep: "#8f6934",
          tint: "#e9d9bd",
        },
        slate: {
          DEFAULT: "#5b6472",
          soft: "#8991a0",
        },
        success: "#2f7d54",
        warning: "#a6741c",
        danger: "#a63a2e",
        info: "#3b6fa0",
      },
      fontFamily: {
        display: [
          "Georgia",
          "Iowan Old Style",
          "Palatino Linotype",
          "Book Antiqua",
          "serif",
        ],
        body: [
          "-apple-system",
          "Segoe UI",
          "SF Pro Text",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SF Mono", "Cascadia Code", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "14px",
      },
    },
  },
};
