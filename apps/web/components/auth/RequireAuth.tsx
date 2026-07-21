"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { ReactNode } from "react";

import { useAuth } from "../../lib/auth/AuthContext";

/** Redirects to /login once the auth check resolves and finds no session; renders nothing while that check is in flight or on the way out. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-[14.5px] text-slate">Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
