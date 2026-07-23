"use client";

import { Button } from "@maya-x/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "../../lib/api/client";
import { useAuth } from "../../lib/auth/AuthContext";

interface RegisterFormValues {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_VALUES: RegisterFormValues = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [values, setValues] = useState<RegisterFormValues>(EMPTY_VALUES);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");

  function update<K extends keyof RegisterFormValues>(
    field: K,
    value: RegisterFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (values.password !== values.confirmPassword) {
      setFormErrors(["Passwords don't match."]);
      return;
    }

    setFormErrors([]);
    setStatus("submitting");

    try {
      await register({
        email: values.email,
        fullName: values.fullName,
        phone: values.phone || undefined,
        password: values.password,
      });
      router.push("/account");
    } catch (error) {
      if (error instanceof ApiError) {
        setFormErrors(
          error.details.length > 0
            ? error.details.map(String)
            : [error.message],
        );
      } else {
        setFormErrors(["Something went wrong. Please try again."]);
      }
    } finally {
      setStatus("idle");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {formErrors.length > 0 ? (
        <div
          role="alert"
          className="rounded-md bg-danger/10 px-3 py-2 text-[13.5px] text-danger"
        >
          {formErrors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      ) : null}

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
          className="rounded-md border border-slate/30 bg-porcelain px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
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
          className="rounded-md border border-slate/30 bg-porcelain px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
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
          className="rounded-md border border-slate/30 bg-porcelain px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
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
          className="rounded-md border border-slate/30 bg-porcelain px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
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
          className="rounded-md border border-slate/30 bg-porcelain px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
        />
      </div>

      <Button type="submit" disabled={status === "submitting"} className="mt-2">
        {status === "submitting" ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
