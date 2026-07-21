/**
 * ESLint config for the NestJS API app.
 * Nest's decorator-heavy style needs a couple of narrowly-scoped relaxations
 * versus the base config — nothing that weakens type safety.
 */
module.exports = {
  root: false,
  extends: [require.resolve("./base.cjs")],
  parserOptions: {
    sourceType: "module",
    project: null,
  },
  rules: {
    // Nest constructor-based DI relies on parameter properties and empty
    // constructors in modules/controllers — both are idiomatic, not bugs.
    "@typescript-eslint/no-useless-constructor": "off",
    "@typescript-eslint/no-extraneous-class": "off",
    // Nest's DI container resolves constructor-injected classes via
    // emitDecoratorMetadata (design:paramtypes), which requires a real
    // value import of the injected class. The base config's
    // consistent-type-imports rule would auto-fix these to `import type`,
    // silently erasing the import and breaking DI at runtime — so it's off
    // here, repo-wide, for every Nest app.
    "@typescript-eslint/consistent-type-imports": "off",
  },
};
