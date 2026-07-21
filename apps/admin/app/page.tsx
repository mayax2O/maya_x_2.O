import { Button } from "@maya-x/ui";

/**
 * M0 bootstrap placeholder. The real Admin Dashboard (metrics, nav shell)
 * arrives with M4 (Admin Core) — this page exists only to prove the
 * pipeline: Next.js -> Tailwind (shared preset) -> @maya-x/ui -> the browser,
 * on a separate app/port from the public site, with no auth wired yet.
 */
export default function AdminHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-6 px-6">
      <p className="font-mono text-xs uppercase tracking-widest text-brass-deep">
        M0 — Project Bootstrap
      </p>
      <h1 className="font-display text-4xl font-semibold text-ink">
        MAYA_X Admin Panel
      </h1>
      <p className="max-w-prose text-slate">
        This is a placeholder confirming the Admin app builds independently from
        the public site. Authentication and the operational dashboard arrive in
        M1 and M4.
      </p>
      <Button variant="secondary" disabled>
        Login (M1)
      </Button>
    </main>
  );
}
