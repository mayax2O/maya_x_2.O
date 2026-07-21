import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-4 bg-ink px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brass">
        404
      </p>
      <h1 className="font-display text-3xl font-semibold text-porcelain">
        Page not found
      </h1>
      <p className="text-porcelain/60">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/" className="font-medium text-brass hover:text-brass-deep">
        Back to dashboard →
      </Link>
    </main>
  );
}
