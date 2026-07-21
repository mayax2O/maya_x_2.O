"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { useAuth } from "../../lib/auth/AuthContext";

/** Redirects to /login once the auth check resolves and finds no admin session. */
export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <p className="text-[14.5px] text-porcelain/60">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
