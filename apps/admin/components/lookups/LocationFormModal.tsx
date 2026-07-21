"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "../../lib/api/client";
import { listAllActiveCities } from "../../lib/data/lookups";
import { createLocation, updateLocation } from "../../lib/data/locations";
import type { City, Location } from "../../lib/types";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";

export function LocationFormModal({
  location,
  isOpen,
  onClose,
  onSaved,
}: {
  location?: Location;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (location: Location) => void;
}) {
  const { showToast } = useToast();
  const [cities, setCities] = useState<City[]>([]);
  const [name, setName] = useState(location?.name ?? "");
  const [cityId, setCityId] = useState(location?.cityId ?? "");
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen)
      listAllActiveCities()
        .then(setCities)
        .catch(() => setCities([]));
  }, [isOpen]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setStatus("submitting");
    try {
      const saved = location
        ? await updateLocation(location.id, { name, cityId })
        : await createLocation({ name, cityId });
      showToast(
        location ? "Location updated." : "Location created.",
        "success",
      );
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
      title={location ? "Edit location" : "Add location"}
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
            htmlFor="location-name"
            className="text-[13px] font-medium text-porcelain/70"
          >
            Location name
          </label>
          <input
            id="location-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="location-city"
            className="text-[13px] font-medium text-porcelain/70"
          >
            City
          </label>
          <select
            id="location-city"
            required
            value={cityId}
            onChange={(event) => setCityId(event.target.value)}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
          >
            <option value="" disabled>
              Select a city
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}, {city.state}
              </option>
            ))}
          </select>
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
