/**
 * ESLint config for the two Next.js apps (web, admin).
 * Extends the shared base and layers in Next.js + React rules.
 */
module.exports = {
  root: false,
  extends: [
    require.resolve("./base.cjs"),
    "next/core-web-vitals",
    "plugin:react-hooks/recommended",
  ],
  rules: {
    "react/react-in-jsx-scope": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
};
