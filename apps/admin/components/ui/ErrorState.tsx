export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold text-porcelain">
        Something went wrong
      </p>
      <p className="max-w-sm text-[14px] text-porcelain/70">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex items-center rounded-md border border-white/20 px-4 py-2 text-[13.5px] font-medium text-porcelain hover:bg-white/5"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
