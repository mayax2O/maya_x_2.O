/**
 * Conventional Commits, enforced via commit-msg hook (see .husky/commit-msg).
 * Scopes are intentionally left open (not enum-restricted) at M0 — revisit
 * once app/package names have stabilized past the bootstrap milestone.
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
};
