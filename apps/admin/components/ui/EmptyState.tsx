import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-ink-soft px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold text-porcelain">
        {title}
      </p>
      {description ? (
        <p className="max-w-sm text-[14px] text-porcelain/60">{description}</p>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
