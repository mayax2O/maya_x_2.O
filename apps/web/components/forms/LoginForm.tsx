"use client";

import { Button } from "@maya-x/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "../../lib/api/client";
import { useAuth } from "../../lib/auth/AuthContext";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setStatus("submitting");

    try {
      await login({ email, password });
      router.push("/account");
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {formError ? (
        <p
          role="alert"
          className="rounded-md bg-danger/10 px-3 py-2 text-[13.5px] text-danger"
        >
          {formError}
        </p>
      ) : null}

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
