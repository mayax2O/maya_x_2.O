"use client";

import { Button } from "@maya-x/ui";
import { useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "../../lib/api/client";
import { submitQuickBooking } from "../../lib/data/bookings";
import { useAuth } from "../../lib/auth/AuthContext";
import type { BookingResponse, QuickBookingFormValues } from "../../lib/types";

type FieldErrors = Partial<Record<keyof QuickBookingFormValues, string>>;

const EMPTY_VALUES: QuickBookingFormValues = {
  talentId: null,
  fullName: "",
  email: "",
  phone: "",
  eventDate: "",
  eventDetails: "",
};

function validate(
  values: QuickBookingFormValues,
  isMember: boolean,
): FieldErrors {
  const errors: FieldErrors = {};

  if (!isMember) {
    if (!values.fullName.trim()) {
      errors.fullName = "Enter your full name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.email = "Enter a complete email address, like name@company.com";
    }
    if (values.phone.replace(/\D/g, "").length < 10) {
      errors.phone = "Enter a valid phone number, including country code.";
    }
  }
  if (!values.eventDate) {
    errors.eventDate = "Select your event date.";
  }
  if (!values.eventDetails.trim()) {
    errors.eventDetails = "Tell us a little about the event.";
  }

  return errors;
}

export function QuickBookingForm({
  talentId = null,
  talentName,
  talentOptions,
  onSuccess,
}: {
  talentId?: string | null;
  talentName?: string;
  /** When provided (standalone Quick Booking page), renders a "preferred talent" select instead of the pre-filled banner. */
  talentOptions?: { id: string; displayName: string }[];
  onSuccess?: (booking: BookingResponse) => void;
}) {
  const { status: authStatus, accessToken, user } = useAuth();
  const isMember = authStatus === "authenticated";

  const [values, setValues] = useState<QuickBookingFormValues>({
    ...EMPTY_VALUES,
    talentId,
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof QuickBookingFormValues, boolean>>
  >({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">(
    "idle",
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleBlur(field: keyof QuickBookingFormValues) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(values, isMember));
  }

  function handleChange<K extends keyof QuickBookingFormValues>(
    field: K,
    value: QuickBookingFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  const selectedTalentName =
    talentName ??
    talentOptions?.find((option) => option.id === values.talentId)?.displayName;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validate(values, isMember);
    setErrors(validationErrors);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      eventDate: true,
      eventDetails: true,
    });

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitError(null);
    setStatus("submitting");
    try {
      const booking = await submitQuickBooking(
        values,
        isMember ? accessToken : null,
        selectedTalentName,
      );
      setStatus("success");
      onSuccess?.(booking);
    } catch (error) {
      setStatus("idle");
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong submitting your request. Please try again.",
      );
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-lg bg-success/10 p-5 text-[14.5px] text-ink"
      >
        <p className="font-semibold">Your request is with our team.</p>
        <p className="mt-1 text-slate">
          We&apos;ll call you within one business day to confirm details
          {selectedTalentName ? ` for ${selectedTalentName}` : ""}.
        </p>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
      {isMember ? (
        <p className="rounded-md bg-brass-tint/40 px-3 py-2 text-[13.5px] text-ink/80">
          Booking as <span className="font-semibold">{user?.fullName}</span> (
          {user?.email})
        </p>
      ) : null}

      {talentName ? (
        <p className="rounded-md bg-brass-tint/40 px-3 py-2 text-[13.5px] text-ink/80">
          Booking request for{" "}
          <span className="font-semibold">{talentName}</span>
        </p>
      ) : null}

      {talentOptions ? (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="qb-talent"
            className="text-[13.5px] font-medium text-ink"
          >
            Preferred talent
          </label>
          <select
            id="qb-talent"
            value={values.talentId ?? ""}
            onChange={(event) =>
              handleChange("talentId", event.target.value || null)
            }
            className="rounded-md border border-slate/30 bg-porcelain px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
          >
            <option value="">
              No preference — recommend based on my event
            </option>
            {talentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.displayName}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {!isMember ? (
        <>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="qb-name"
              className="text-[13.5px] font-medium text-ink"
            >
              Full name
            </label>
            <input
              id="qb-name"
              type="text"
              value={values.fullName}
              onChange={(event) => handleChange("fullName", event.target.value)}
              onBlur={() => handleBlur("fullName")}
              className="rounded-md border border-slate/30 bg-porcelain px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
              aria-invalid={touched.fullName && Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? "qb-name-error" : undefined}
            />
            {touched.fullName && errors.fullName ? (
              <p id="qb-name-error" className="text-[13px] text-danger">
                {errors.fullName}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="qb-email"
              className="text-[13.5px] font-medium text-ink"
            >
              Email address
            </label>
            <input
              id="qb-email"
              type="email"
              value={values.email}
              onChange={(event) => handleChange("email", event.target.value)}
              onBlur={() => handleBlur("email")}
              className="rounded-md border border-slate/30 bg-porcelain px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
              aria-invalid={touched.email && Boolean(errors.email)}
              aria-describedby={errors.email ? "qb-email-error" : undefined}
            />
            {touched.email && errors.email ? (
              <p id="qb-email-error" className="text-[13px] text-danger">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="qb-phone"
              className="text-[13.5px] font-medium text-ink"
            >
              Phone number
            </label>
            <input
              id="qb-phone"
              type="tel"
              value={values.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
              onBlur={() => handleBlur("phone")}
              placeholder="+91 98765 43210"
              className="rounded-md border border-slate/30 bg-porcelain px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
              aria-invalid={touched.phone && Boolean(errors.phone)}
              aria-describedby={errors.phone ? "qb-phone-error" : undefined}
            />
            {touched.phone && errors.phone ? (
              <p id="qb-phone-error" className="text-[13px] text-danger">
                {errors.phone}
              </p>
            ) : null}
          </div>
        </>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="qb-date" className="text-[13.5px] font-medium text-ink">
          Event date
        </label>
        <input
          id="qb-date"
          type="date"
          value={values.eventDate}
          onChange={(event) => handleChange("eventDate", event.target.value)}
          onBlur={() => handleBlur("eventDate")}
          className="rounded-md border border-slate/30 bg-porcelain px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
          aria-invalid={touched.eventDate && Boolean(errors.eventDate)}
          aria-describedby={errors.eventDate ? "qb-date-error" : undefined}
        />
        {touched.eventDate && errors.eventDate ? (
          <p id="qb-date-error" className="text-[13px] text-danger">
            {errors.eventDate}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="qb-details"
          className="text-[13.5px] font-medium text-ink"
        >
          Event details
        </label>
        <textarea
          id="qb-details"
          rows={3}
          value={values.eventDetails}
          onChange={(event) => handleChange("eventDetails", event.target.value)}
          onBlur={() => handleBlur("eventDetails")}
          placeholder="Event type, guest count, city, and any specific requirements"
          className="rounded-md border border-slate/30 bg-porcelain px-3 py-2.5 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
          aria-invalid={touched.eventDetails && Boolean(errors.eventDetails)}
          aria-describedby={
            errors.eventDetails ? "qb-details-error" : undefined
          }
        />
        {touched.eventDetails && errors.eventDetails ? (
          <p id="qb-details-error" className="text-[13px] text-danger">
            {errors.eventDetails}
          </p>
        ) : null}
      </div>

      {submitError ? (
        <p role="alert" className="text-[13.5px] text-danger">
          {submitError}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={status === "submitting"}
        className="mt-2 w-full justify-center"
      >
        {status === "submitting" ? "Submitting…" : "Submit Booking Request"}
      </Button>
    </form>
  );
}
