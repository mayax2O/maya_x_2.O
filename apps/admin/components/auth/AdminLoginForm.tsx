"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "../../lib/api/client";
import { useAuth } from "../../lib/auth/AuthContext";

export function AdminLoginForm() {
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
      router.push("/");
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
          htmlFor="admin-login-email"
          className="text-[13.5px] font-medium text-porcelain"
        >
          Email address
        </label>
        <input
          id="admin-login-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-md border border-white/15 bg-ink px-3 py-2.5 text-[14.5px] text-porcelain focus:border-brass focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="admin-login-password"
          className="text-[13.5px] font-medium text-porcelain"
        >
          Password
        </label>
        <input
          id="admin-login-password"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-md border border-white/15 bg-ink px-3 py-2.5 text-[14.5px] text-porcelain focus:border-brass focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-2 inline-flex items-center justify-center rounded-md bg-brass-deep px-5 py-2.5 text-[14.5px] font-semibold text-white transition hover:bg-brass disabled:cursor-not-allowed disabled:opacity-45"
      >
        {status === "submitting" ? "Signing in…" : "Log in"}
      </button>
    </form>
  );
}
