import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  icon,
  mocked,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  mocked?: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-ink-soft p-5">
      <div className="flex items-start justify-between">
        <p className="text-[12.5px] font-medium uppercase tracking-wide text-porcelain/50">
          {label}
        </p>
        <span className="text-brass">{icon}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-porcelain">
        {value}
      </p>
      {mocked ? (
        <p className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] text-porcelain/40">
          <span
            className="h-1.5 w-1.5 rounded-full bg-porcelain/30"
            aria-hidden="true"
          />
          Placeholder — coming with a future milestone
        </p>
      ) : null}
    </div>
  );
}
