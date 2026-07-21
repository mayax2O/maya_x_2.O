"use client";

import { Button } from "@maya-x/ui";
import { useState } from "react";
import type { FormEvent } from "react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  // Mock only — no backend yet (M2 UI foundation). Swap for a real
  // POST to the auth endpoint once it exists; the form fields and
  // validation shape won't need to change.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    window.setTimeout(() => setStatus("idle"), 500);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="login-email"
          className="text-[13.5px] font-medium text-ink"
        >
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-md border border-slate/30 px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="login-password"
            className="text-[13.5px] font-medium text-ink"
          >
            Password
          </label>
          <Button type="button" variant="ghost" size="sm" className="px-0 py-0">
            Forgot password?
          </Button>
        </div>
        <input
          id="login-password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-md border border-slate/30 px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
        />
      </div>

      <Button type="submit" disabled={status === "submitting"} className="mt-2">
        {status === "submitting" ? "Signing in…" : "Log in"}
      </Button>
    </form>
  );
}
