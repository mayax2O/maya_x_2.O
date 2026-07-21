"use client";

import { Button } from "@maya-x/ui";
import { useState } from "react";
import type { FormEvent } from "react";

interface RegisterValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_VALUES: RegisterValues = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export function RegisterForm() {
  const [values, setValues] = useState<RegisterValues>(EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  function update<K extends keyof RegisterValues>(
    field: K,
    value: RegisterValues[K],
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  // Mock only — no backend yet (M2 UI foundation). Swap for a real
  // POST to the auth endpoint once it exists.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (values.password !== values.confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setError(null);
    setStatus("submitting");
    window.setTimeout(() => setStatus("idle"), 500);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="register-name"
          className="text-[13.5px] font-medium text-ink"
        >
          Full name
        </label>
        <input
          id="register-name"
          type="text"
          required
          value={values.fullName}
          onChange={(event) => update("fullName", event.target.value)}
          className="rounded-md border border-slate/30 px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="register-email"
          className="text-[13.5px] font-medium text-ink"
        >
          Email address
        </label>
        <input
          id="register-email"
          type="email"
          required
          value={values.email}
          onChange={(event) => update("email", event.target.value)}
          className="rounded-md border border-slate/30 px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="register-phone"
          className="text-[13.5px] font-medium text-ink"
        >
          Phone number
        </label>
        <input
          id="register-phone"
          type="tel"
          required
          value={values.phone}
          onChange={(event) => update("phone", event.target.value)}
          placeholder="+91 98765 43210"
          className="rounded-md border border-slate/30 px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="register-password"
          className="text-[13.5px] font-medium text-ink"
        >
          Password
        </label>
        <input
          id="register-password"
          type="password"
          required
          minLength={8}
          value={values.password}
          onChange={(event) => update("password", event.target.value)}
          className="rounded-md border border-slate/30 px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="register-confirm-password"
          className="text-[13.5px] font-medium text-ink"
        >
          Confirm password
        </label>
        <input
          id="register-confirm-password"
          type="password"
          required
          minLength={8}
          value={values.confirmPassword}
          onChange={(event) => update("confirmPassword", event.target.value)}
          className="rounded-md border border-slate/30 px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "register-error" : undefined}
        />
        {error ? (
          <p id="register-error" className="text-[13px] text-danger">
            {error}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={status === "submitting"} className="mt-2">
        {status === "submitting" ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
