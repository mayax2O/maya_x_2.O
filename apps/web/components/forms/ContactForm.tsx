"use client";

import { Button } from "@maya-x/ui";
import { useState } from "react";
import type { FormEvent } from "react";

interface ContactFormValues {
  fullName: string;
  email: string;
  message: string;
}

const EMPTY_VALUES: ContactFormValues = {
  fullName: "",
  email: "",
  message: "",
};

export function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(EMPTY_VALUES);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    // Mock only — no backend yet (M2 UI foundation). Swap for a real
    // POST to the contact/support endpoint once it exists.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setStatus("success");
    setValues(EMPTY_VALUES);
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-lg bg-success/10 p-5 text-[14.5px] text-ink"
      >
        <p className="font-semibold">Message sent.</p>
        <p className="mt-1 text-slate">
          Our team will get back to you within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="contact-name"
          className="text-[13.5px] font-medium text-ink"
        >
          Full name
        </label>
        <input
          id="contact-name"
          type="text"
          required
          value={values.fullName}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, fullName: event.target.value }))
          }
          className="rounded-md border border-slate/30 bg-porcelain px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="contact-email"
          className="text-[13.5px] font-medium text-ink"
        >
          Email address
        </label>
        <input
          id="contact-email"
          type="email"
          required
          value={values.email}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, email: event.target.value }))
          }
          className="rounded-md border border-slate/30 bg-porcelain px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="contact-message"
          className="text-[13.5px] font-medium text-ink"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={4}
          value={values.message}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, message: event.target.value }))
          }
          className="rounded-md border border-slate/30 bg-porcelain px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
        />
      </div>

      <Button type="submit" disabled={status === "submitting"} className="mt-2">
        {status === "submitting" ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
