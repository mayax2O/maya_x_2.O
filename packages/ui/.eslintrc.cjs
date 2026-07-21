module.exports = {
  root: true,
  extends: [require.resolve("@maya-x/config/eslint/base.cjs")],
  plugins: ["react", "react-hooks"],
  settings: { react: { version: "18.3" } },
  rules: {
    "react/react-in-jsx-scope": "off",
  },
};
