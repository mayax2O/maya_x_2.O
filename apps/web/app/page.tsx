import { Button } from "@maya-x/ui";

/**
 * M0 bootstrap placeholder. The real talent gallery/homepage arrives with
 * M2 (Talent Catalog) — this page exists only to prove the pipeline:
 * Next.js -> Tailwind (shared preset) -> @maya-x/ui -> the browser.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-6 px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brass-deep">
        M0 — Project Bootstrap
      </p>
      <h1 className="font-display text-4xl font-semibold text-ink">
        MAYA_X_2.0 public site
      </h1>
      <p className="max-w-prose text-slate">
        This is a placeholder homepage confirming the monorepo pipeline is wired
        end-to-end. Talent discovery, search, and booking arrive in later
        milestones.
      </p>
      <Button variant="primary" disabled>
        Submit Booking Request (M3)
      </Button>
    </main>
  );
}
