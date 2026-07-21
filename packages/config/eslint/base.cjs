/**
 * Base ESLint config shared by every app and package.
 *
 * Decision: traditional `.eslintrc`-style shareable configs (not ESLint 9
 * flat config). eslint-config-next's flat-config support and NestJS's
 * community tooling are still stabilizing around flat config as of this
 * writing — the legacy format has the widest, most predictable
 * compatibility across Next.js + NestJS in a single monorepo. Revisit this
 * once both ecosystems settle on flat config.
 */
module.exports = {
  root: false,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  env: {
    node: true,
    es2022: true,
  },
  ignorePatterns: [
    "dist",
    "build",
    ".next",
    "node_modules",
    "coverage",
    "*.config.js",
    "*.config.cjs",
    // Next.js auto-generates and rewrites this file on every build; it's
    // never hand-edited, so it's never linted.
    "next-env.d.ts",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/consistent-type-imports": [
      "warn",
      { prefer: "type-imports" },
    ],
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
};
