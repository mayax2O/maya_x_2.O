import type { ReactNode } from "react";

/**
 * Max-width + gutter wrapper matching the design system's grid (§05):
 * 1280px max content width, centered, with responsive side padding.
 */
export function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "mx-auto w-full max-w-[1280px] px-4 sm:px-8 lg:px-12",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
