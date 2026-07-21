import { Transform } from "class-transformer";

/**
 * Query-string booleans arrive as the literal strings "true"/"false" (or
 * are absent). Apply above `@IsOptional() @IsBoolean()` so validation sees
 * an actual boolean, not the raw string.
 */
export function BoolQueryParam() {
  return Transform(({ value }: { value: unknown }) => {
    if (value === undefined) return undefined;
    if (typeof value === "boolean") return value;
    return value === "true";
  });
}
