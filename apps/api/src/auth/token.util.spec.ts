import { hashRefreshToken, parseDurationMs } from "./token.util";

describe("token.util", () => {
  describe("hashRefreshToken", () => {
    it("is deterministic for the same input", () => {
      expect(hashRefreshToken("abc")).toBe(hashRefreshToken("abc"));
    });

    it("differs for different input", () => {
      expect(hashRefreshToken("abc")).not.toBe(hashRefreshToken("abd"));
    });
  });

  describe("parseDurationMs", () => {
    it.each([
      ["15m", 15 * 60_000],
      ["30d", 30 * 86_400_000],
      ["1h", 3_600_000],
      ["45s", 45_000],
    ])("parses %s", (input, expected) => {
      expect(parseDurationMs(input)).toBe(expected);
    });

    it("throws on an unrecognized format", () => {
      expect(() => parseDurationMs("15")).toThrow();
      expect(() => parseDurationMs("15 minutes")).toThrow();
    });
  });
});
