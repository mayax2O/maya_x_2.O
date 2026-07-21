"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "../../lib/api/client";
import { createCity, updateCity } from "../../lib/data/cities";
import type { City } from "../../lib/types";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";

export function CityFormModal({
  city,
  isOpen,
  onClose,
  onSaved,
}: {
  city?: City;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (city: City) => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState(city?.name ?? "");
  const [state, setState] = useState(city?.state ?? "");
  const [displayOrder, setDisplayOrder] = useState(city?.displayOrder ?? 0);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setStatus("submitting");
    try {
      const saved = city
        ? await updateCity(city.id, { name, state, displayOrder })
        : await createCity({ name, state, displayOrder });
      showToast(city ? "City updated." : "City created.", "success");
      onSaved(saved);
      onClose();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Something went wrong.",
      );
    } finally {
      setStatus("idle");
    }
  }

  return (
    <Modal
      title={city ? "Edit city" : "Add city"}
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClassName="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError ? (
          <p
            role="alert"
            className="rounded-md bg-danger/10 px-3 py-2 text-[13px] text-danger"
          >
            {formError}
          </p>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="city-name"
            className="text-[13px] font-medium text-porcelain/70"
          >
            City name
          </label>
          <input
            id="city-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="city-state"
            className="text-[13px] font-medium text-porcelain/70"
          >
            State
          </label>
          <input
            id="city-state"
            required
            value={state}
            onChange={(event) => setState(event.target.value)}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="city-order"
            className="text-[13px] font-medium text-porcelain/70"
          >
            Display order
          </label>
          <input
            id="city-order"
            type="number"
            value={displayOrder}
            onChange={(event) => setDisplayOrder(Number(event.target.value))}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="mt-2 inline-flex items-center justify-center rounded-md bg-brass-deep px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-brass disabled:cursor-not-allowed disabled:opacity-45"
        >
          {status === "submitting" ? "Saving…" : "Save"}
        </button>
      </form>
    </Modal>
  );
}
