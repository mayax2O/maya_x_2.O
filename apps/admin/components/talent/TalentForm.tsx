"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "../../lib/api/client";
import { listLocations } from "../../lib/data/locations";
import {
  addTalentMedia,
  createTalent,
  setPrimaryTalentMedia,
  updateTalent,
} from "../../lib/data/talent";
import {
  listAllActiveCategories,
  listAllActiveCities,
} from "../../lib/data/lookups";
import type {
  City,
  Location,
  MediaAsset,
  Talent,
  TalentCategory,
  TalentFormValues,
  TalentMedia,
} from "../../lib/types";
import { MediaPickerModal } from "../media/MediaPickerModal";
import { MediaThumbnail } from "../media/MediaThumbnail";
import { useToast } from "../ui/Toast";

const AVAILABILITY_OPTIONS: {
  value: TalentFormValues["availability"];
  label: string;
}[] = [
  { value: "available", label: "Available" },
  { value: "limited", label: "Limited availability" },
  { value: "unavailable", label: "Unavailable" },
];

const NATIONALITY_OPTIONS = [
  "Indian",
  "American",
  "British",
  "Canadian",
  "Australian",
  "Russian",
  "Chinese",
  "Japanese",
  "South Korean",
  "Singaporean",
  "Emirati",
  "Nepali",
  "Bangladeshi",
  "Sri Lankan",
];

const VERIFICATION_OPTIONS: {
  value: TalentFormValues["verificationStatus"];
  label: string;
}[] = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

function talentToFormValues(talent: Talent): TalentFormValues {
  return {
    displayName: talent.displayName,
    slug: talent.slug,
    tagline: talent.tagline ?? "",
    bio: talent.bio ?? "",
    age: talent.age ?? undefined,
    cityId: talent.city.id,
    locationId: talent.location?.id,
    languages: talent.languages,
    heightCm: talent.heightCm ?? undefined,
    bodyType: talent.bodyType ?? "",
    nationality: talent.nationality ?? "",
    measurements: talent.measurements ?? "",
    dressSize: talent.dressSize ?? "",
    hairColour: talent.hairColour ?? "",
    eyeColour: talent.eyeColour ?? "",
    generalAvailability: talent.generalAvailability ?? "",
    currency: talent.pricing.currency,
    basePrice: talent.pricing.basePrice,
    hourlyRate: talent.pricing.hourlyRate ?? undefined,
    overnightRate: talent.pricing.overnightRate ?? undefined,
    weekendRate: talent.pricing.weekendRate ?? undefined,
    customPricingNotes: talent.pricing.customPricingNotes ?? "",
    availability: talent.availability,
    verificationStatus: talent.verificationStatus,
    isPremium: talent.isPremium,
    isFeatured: talent.isFeatured,
    isActive: talent.isActive,
    displayOrder: talent.displayOrder,
    categoryIds: talent.categories.map((category) => category.id),
  };
}

const EMPTY_VALUES: TalentFormValues = {
  displayName: "",
  cityId: "",
  basePrice: 0,
  availability: "available",
  verificationStatus: "pending",
  isActive: true,
  categoryIds: [],
};

export function TalentForm({
  talent,
  onSaved,
  media = [],
  onMediaChange,
}: {
  talent?: Talent;
  onSaved: (talent: Talent) => void;
  /** Current gallery, so the profile-image widget can show/replace the
   * primary image without a separate fetch. Omitted (and the widget
   * hidden) when creating a brand-new talent, since there's no id yet
   * to attach media to. */
  media?: TalentMedia[];
  onMediaChange?: (media: TalentMedia[]) => void;
}) {
  const { showToast } = useToast();
  const [values, setValues] = useState<TalentFormValues>(
    talent ? talentToFormValues(talent) : EMPTY_VALUES,
  );
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<TalentCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [languagesText, setLanguagesText] = useState(
    (talent?.languages ?? []).join(", "),
  );
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  useEffect(() => {
    listAllActiveCities()
      .then(setCities)
      .catch(() => setCities([]));
    listAllActiveCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!values.cityId) {
      setLocations([]);
      return;
    }
    let cancelled = false;
    listLocations({ cityId: values.cityId, isActive: true, perPage: 100 })
      .then((result) => {
        if (!cancelled) setLocations(result.items);
      })
      .catch(() => {
        if (!cancelled) setLocations([]);
      });
    return () => {
      cancelled = true;
    };
  }, [values.cityId]);

  // The city/location dropdowns only list *active* rows (they're pickers
  // for creating/editing, not a full directory) — but a talent already
  // assigned to a since-deactivated city/location must still show it as
  // selected, or the select silently falls back to blank/first-option and
  // looks like "the city isn't loading." Merge the talent's current value
  // in if the active-only list doesn't already contain it.
  const cityOptions =
    talent && !cities.some((city) => city.id === talent.city.id)
      ? [
          ...cities,
          {
            id: talent.city.id,
            name: talent.city.name,
            state: talent.city.state,
            isActive: false,
            displayOrder: 0,
            createdAt: "",
            updatedAt: "",
          },
        ]
      : cities;

  const locationOptions =
    talent?.location && !locations.some((l) => l.id === talent.location?.id)
      ? [
          ...locations,
          {
            id: talent.location.id,
            name: talent.location.name,
            cityId: talent.city.id,
            city: talent.city,
            isActive: false,
            displayOrder: 0,
            createdAt: "",
            updatedAt: "",
          },
        ]
      : locations;

  // A talent saved before this list existed (or with a free-text value
  // outside it) must still show its actual nationality instead of the
  // select silently resetting to blank.
  const nationalityOptions =
    values.nationality && !NATIONALITY_OPTIONS.includes(values.nationality)
      ? [values.nationality, ...NATIONALITY_OPTIONS]
      : NATIONALITY_OPTIONS;

  const primaryImage = media.find((item) => item.isPrimary) ?? media[0];

  async function handleProfileImagePicked(asset: MediaAsset) {
    if (!talent) return;
    setImagePickerOpen(false);
    try {
      const created = await addTalentMedia(talent.id, {
        mediaAssetId: asset.id,
      });
      let next: TalentMedia[];
      if (created.isPrimary) {
        // Gallery was empty — the new upload is already primary.
        next = [...media, created];
      } else {
        await setPrimaryTalentMedia(talent.id, created.id);
        next = [
          ...media.map((item) => ({ ...item, isPrimary: false })),
          { ...created, isPrimary: true },
        ];
      }
      onMediaChange?.(next);
      showToast("Profile image updated.", "success");
    } catch (error) {
      showToast(
        error instanceof ApiError
          ? error.message
          : "Failed to update profile image.",
        "error",
      );
    }
  }

  function update<K extends keyof TalentFormValues>(
    field: K,
    value: TalentFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function toggleCategory(categoryId: string) {
    setValues((prev) => {
      const current = prev.categoryIds ?? [];
      const next = current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId];
      return { ...prev, categoryIds: next };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setStatus("submitting");

    const payload: TalentFormValues = {
      ...values,
      languages: languagesText
        .split(",")
        .map((language) => language.trim())
        .filter(Boolean),
    };

    try {
      const saved = talent
        ? await updateTalent(talent.id, payload)
        : await createTalent(payload);
      showToast(
        talent ? "Talent profile updated." : "Talent profile created.",
        "success",
      );
      onSaved(saved);
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {formError ? (
        <p
          role="alert"
          className="rounded-md bg-danger/10 px-3 py-2 text-[13.5px] text-danger"
        >
          {formError}
        </p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_200px]">
        <h2 className="col-span-full font-display text-lg font-semibold text-porcelain">
          Basic information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display name" htmlFor="talent-name">
            <input
              id="talent-name"
              required
              value={values.displayName}
              onChange={(event) => update("displayName", event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field
            label="Slug (auto-generated if left blank)"
            htmlFor="talent-slug"
          >
            <input
              id="talent-slug"
              value={values.slug ?? ""}
              onChange={(event) => update("slug", event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Tagline / short description" htmlFor="talent-tagline">
            <input
              id="talent-tagline"
              value={values.tagline ?? ""}
              onChange={(event) => update("tagline", event.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Age" htmlFor="talent-age">
            <input
              id="talent-age"
              type="number"
              min={1}
              max={100}
              value={values.age ?? ""}
              onChange={(event) =>
                update(
                  "age",
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
              className={inputClass}
            />
          </Field>

          <Field
            label="Full description"
            htmlFor="talent-bio"
            className="sm:col-span-2"
          >
            <textarea
              id="talent-bio"
              rows={4}
              value={values.bio ?? ""}
              onChange={(event) => update("bio", event.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {/* Section: Profile image — the gallery item shown on the Talent
            Card and Profile Preview (i.e. the gallery's primary image),
            surfaced here for quick access instead of only in Gallery. */}
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-medium text-porcelain/70">
            Profile image
          </p>
          <div className="aspect-square w-full overflow-hidden rounded-lg border border-white/10 bg-ink">
            {primaryImage ? (
              <MediaThumbnail
                src={primaryImage.optimizedUrl}
                alt={primaryImage.alt}
                className="h-full w-full"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-center text-[12px] text-porcelain/40">
                No image yet
              </div>
            )}
          </div>
          {talent ? (
            <button
              type="button"
              onClick={() => setImagePickerOpen(true)}
              className="rounded-md border border-white/15 px-3 py-2 text-[13px] text-porcelain/80 hover:bg-white/5"
            >
              {primaryImage ? "Change image" : "Add image"}
            </button>
          ) : (
            <p className="text-[12px] text-porcelain/50">
              Save the talent first to add a profile image.
            </p>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="col-span-full font-display text-lg font-semibold text-porcelain">
          Location
        </h2>

        <Field label="City" htmlFor="talent-city">
          <select
            id="talent-city"
            required
            value={values.cityId}
            onChange={(event) => {
              update("cityId", event.target.value);
              update("locationId", undefined);
            }}
            className={inputClass}
          >
            <option value="" disabled>
              Select a city
            </option>
            {cityOptions.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}, {city.state}
                {city.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Location (optional)" htmlFor="talent-location">
          <select
            id="talent-location"
            value={values.locationId ?? ""}
            onChange={(event) =>
              update("locationId", event.target.value || undefined)
            }
            disabled={!values.cityId}
            className={inputClass}
          >
            <option value="">No specific location</option>
            {locationOptions.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
                {location.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <hr className="border-white/10" />

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="col-span-full font-display text-lg font-semibold text-porcelain">
          Basic Details &amp; Measurements
        </h2>

        <Field
          label="Languages (comma-separated)"
          htmlFor="talent-languages"
          className="sm:col-span-2"
        >
          <input
            id="talent-languages"
            value={languagesText}
            onChange={(event) => setLanguagesText(event.target.value)}
            placeholder="English, Bengali, Hindi"
            className={inputClass}
          />
        </Field>

        <Field label="Nationality" htmlFor="talent-nationality">
          <select
            id="talent-nationality"
            value={values.nationality ?? ""}
            onChange={(event) => update("nationality", event.target.value)}
            className={inputClass}
          >
            <option value="">Select nationality</option>
            {nationalityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Height (cm)" htmlFor="talent-height">
          <input
            id="talent-height"
            type="number"
            min={50}
            max={250}
            value={values.heightCm ?? ""}
            onChange={(event) =>
              update(
                "heightCm",
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            className={inputClass}
          />
        </Field>

        <Field label="Body type" htmlFor="talent-body-type">
          <input
            id="talent-body-type"
            value={values.bodyType ?? ""}
            onChange={(event) => update("bodyType", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Measurements" htmlFor="talent-measurements">
          <input
            id="talent-measurements"
            placeholder="e.g. 34-28-35"
            value={values.measurements ?? ""}
            onChange={(event) => update("measurements", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Dress size" htmlFor="talent-dress-size">
          <input
            id="talent-dress-size"
            value={values.dressSize ?? ""}
            onChange={(event) => update("dressSize", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Hair colour" htmlFor="talent-hair-colour">
          <input
            id="talent-hair-colour"
            value={values.hairColour ?? ""}
            onChange={(event) => update("hairColour", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Eye colour" htmlFor="talent-eye-colour">
          <input
            id="talent-eye-colour"
            value={values.eyeColour ?? ""}
            onChange={(event) => update("eyeColour", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field
          label="General availability"
          htmlFor="talent-general-availability"
        >
          <input
            id="talent-general-availability"
            placeholder="e.g. Full-time, Flexible"
            value={values.generalAvailability ?? ""}
            onChange={(event) =>
              update("generalAvailability", event.target.value)
            }
            className={inputClass}
          />
        </Field>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="col-span-full font-display text-lg font-semibold text-porcelain">
          Pricing
        </h2>

        <Field label="Currency" htmlFor="talent-currency">
          <input
            id="talent-currency"
            value={values.currency ?? "INR"}
            onChange={(event) => update("currency", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Base price" htmlFor="talent-base-price">
          <input
            id="talent-base-price"
            type="number"
            required
            min={0}
            value={values.basePrice}
            onChange={(event) =>
              update("basePrice", Number(event.target.value))
            }
            className={inputClass}
          />
        </Field>

        <Field label="Hourly rate" htmlFor="talent-hourly-rate">
          <input
            id="talent-hourly-rate"
            type="number"
            min={0}
            value={values.hourlyRate ?? ""}
            onChange={(event) =>
              update(
                "hourlyRate",
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            className={inputClass}
          />
        </Field>

        <Field
          label="Overnight / multi-day event rate"
          htmlFor="talent-overnight-rate"
        >
          <input
            id="talent-overnight-rate"
            type="number"
            min={0}
            value={values.overnightRate ?? ""}
            onChange={(event) =>
              update(
                "overnightRate",
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            className={inputClass}
          />
        </Field>

        <Field label="Weekend event rate" htmlFor="talent-weekend-rate">
          <input
            id="talent-weekend-rate"
            type="number"
            min={0}
            value={values.weekendRate ?? ""}
            onChange={(event) =>
              update(
                "weekendRate",
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            className={inputClass}
          />
        </Field>

        <Field
          label="Custom pricing notes"
          htmlFor="talent-custom-pricing"
          className="sm:col-span-2"
        >
          <textarea
            id="talent-custom-pricing"
            rows={2}
            value={values.customPricingNotes ?? ""}
            onChange={(event) =>
              update("customPricingNotes", event.target.value)
            }
            className={inputClass}
          />
        </Field>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-porcelain">
          Categories
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((category) => {
            const isChecked = (values.categoryIds ?? []).includes(category.id);
            return (
              <label
                key={category.id}
                className={[
                  "cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition",
                  isChecked
                    ? "border-brass bg-brass-deep/20 text-brass"
                    : "border-white/15 text-porcelain/70 hover:border-white/30",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCategory(category.id)}
                  className="sr-only"
                />
                {category.name}
              </label>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="col-span-full font-display text-lg font-semibold text-porcelain">
          Status
        </h2>

        <Field label="Availability" htmlFor="talent-availability">
          <select
            id="talent-availability"
            value={values.availability}
            onChange={(event) =>
              update(
                "availability",
                event.target.value as TalentFormValues["availability"],
              )
            }
            className={inputClass}
          >
            {AVAILABILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Verification status" htmlFor="talent-verification">
          <select
            id="talent-verification"
            value={values.verificationStatus}
            onChange={(event) =>
              update(
                "verificationStatus",
                event.target.value as TalentFormValues["verificationStatus"],
              )
            }
            className={inputClass}
          >
            {VERIFICATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Display order" htmlFor="talent-display-order">
          <input
            id="talent-display-order"
            type="number"
            value={values.displayOrder ?? 0}
            onChange={(event) =>
              update("displayOrder", Number(event.target.value))
            }
            className={inputClass}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
          <Checkbox
            label="Active"
            checked={values.isActive ?? true}
            onChange={(checked) => update("isActive", checked)}
          />
          <Checkbox
            label="Premium"
            checked={values.isPremium ?? false}
            onChange={(checked) => update("isPremium", checked)}
          />
          <Checkbox
            label="Featured"
            checked={values.isFeatured ?? false}
            onChange={(checked) => update("isFeatured", checked)}
          />
        </div>
      </section>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex w-fit items-center justify-center rounded-md bg-brass-deep px-6 py-2.5 text-[14.5px] font-semibold text-white transition hover:bg-brass disabled:cursor-not-allowed disabled:opacity-45"
      >
        {status === "submitting"
          ? "Saving…"
          : talent
            ? "Save changes"
            : "Create talent"}
      </button>

      {talent ? (
        <MediaPickerModal
          isOpen={imagePickerOpen}
          onClose={() => setImagePickerOpen(false)}
          onSelect={handleProfileImagePicked}
        />
      ) : null}
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-white/15 bg-ink px-3 py-2.5 text-[14px] text-porcelain focus:border-brass focus:outline-none";

function Field({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={["flex flex-col gap-1.5", className].filter(Boolean).join(" ")}
    >
      <label
        htmlFor={htmlFor}
        className="text-[13px] font-medium text-porcelain/70"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[13.5px] text-porcelain/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-brass-deep"
      />
      {label}
    </label>
  );
}
