import type { Metadata } from "next";

import { AdminLoginForm } from "../../components/auth/AdminLoginForm";

export const metadata: Metadata = {
  title: "Log in",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm">
        <p className="text-center font-display text-2xl font-semibold text-porcelain">
          MAYA<span className="italic text-brass">X</span>
        </p>
        <p className="mt-1 text-center text-[13px] uppercase tracking-widest text-porcelain/40">
          Admin panel
        </p>

        <div className="mt-8 rounded-lg border border-white/10 bg-ink-soft p-6">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
