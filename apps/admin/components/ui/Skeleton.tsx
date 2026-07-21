export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={["animate-pulse rounded-md bg-white/10", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export function SkeletonTableRows({
  columns,
  rows = 6,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <td key={columnIndex} className="px-4 py-3">
              <Skeleton className="h-4 w-full max-w-[160px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
