import type { ReactNode } from "react";

/**
 * Fluid, full-width gutter wrapper — no max-width cap by default, just
 * responsive side padding, so page content spans the viewport. Callers
 * that want a narrower reading width (forms, FAQ, etc.) pass their own
 * `max-w-*` in `className`, which overrides this.
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
      className={["w-full px-4 sm:px-8 lg:px-12", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
