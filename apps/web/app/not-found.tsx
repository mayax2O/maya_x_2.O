import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-start justify-center gap-4 px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brass-deep">
        404
      </p>
      <h1 className="font-display text-3xl font-semibold text-ink">
        Page not found
      </h1>
      <p className="text-slate">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/" className="font-medium text-brass-deep hover:text-brass">
        Back to home →
      </Link>
    </div>
  );
}
