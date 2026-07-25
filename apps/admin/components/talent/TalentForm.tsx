"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "../../lib/api/client";
import { listLocations } from "../../lib/data/locations";
import {
  addTalentMedia,
  createTalent,
  listTalent,
  setPrimaryTalentMedia,
  updateTalent,
} from "../../lib/data/talent";
import {
  listAllActiveCategories,
  listAllActiveCities,
  listAllActiveSubCategories,
} from "../../lib/data/lookups";
import type {
  City,
  Location,
  MediaAsset,
  Talent,
  TalentCategory,
  TalentFormValues,
  TalentMedia,
  TalentSubCategory,
} from "../../lib/types";
import { ChipMultiSelect } from "../ui/ChipMultiSelect";
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

const LANGUAGE_OPTIONS = ["English", "Hindi", "Bengali", "Russian", "Spanish"];

const BODY_TYPE_OPTIONS = ["Slim", "Curvy", "Glamour", "Skinny"];

const HAIR_COLOUR_OPTIONS = ["Black", "Blond", "White", "Grey"];

const HAIR_LENGTH_OPTIONS = ["Short", "Medium", "Long", "Bob Cut"];

const GENERAL_AVAILABILITY_OPTIONS = ["Full Time", "Part Time", "Flexible"];

// Mirrors MAX_FEATURED_TALENTS in the API's TalentService — the home page's
// Featured row is a fixed trio. The API is the real enforcer (it rejects a
// 4th); this constant only drives the hint and the disabled state, so an
// admin sees the limit before submitting rather than after.
const MAX_FEATURED = 3;

const FEET_OPTIONS = [3, 4, 5, 6, 7];
const INCHES_OPTIONS = Array.from({ length: 12 }, (_, i) => i);

function cmToFeetInches(cm: number | undefined): {
  feet: number | "";
  inches: number | "";
} {
  if (!cm) return { feet: "", inches: "" };
  const totalInches = Math.round(cm / 2.54);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

function feetInchesToCm(
  feet: number | "",
  inches: number | "",
): number | undefined {
  if (feet === "" && inches === "") return undefined;
  const totalInches =
    (feet === "" ? 0 : feet) * 12 + (inches === "" ? 0 : inches);
  return Math.round(totalInches * 2.54);
}

function withCurrentValue(
  options: string[],
  currentValue: string | undefined,
): string[] {
  return currentValue && !options.includes(currentValue)
    ? [currentValue, ...options]
    : options;
}

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
    weightKg: talent.weightKg ?? undefined,
    bodyType: talent.bodyType ?? "",
    preferredCityIds: talent.preferredCityIds,
    availableOutside: talent.availableOutside,
    nationality: talent.nationality ?? "",
    measurements: talent.measurements ?? "",
    chest: talent.chest ?? "",
    waist: talent.waist ?? "",
    hip: talent.hip ?? "",
    dressSize: talent.dressSize ?? "",
    hairColour: talent.hairColour ?? "",
    hairLength: talent.hairLength ?? "",
    eyeColour: talent.eyeColour ?? "",
    generalAvailability: talent.generalAvailability ?? "",
    mobile: talent.mobile ?? "",
    mobile2: talent.mobile2 ?? "",
    whatsapp: talent.whatsapp ?? "",
    telegram: talent.telegram ?? "",
    otherContact: talent.otherContact ?? "",
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
    subCategoryIds: talent.subCategories.map((subCategory) => subCategory.id),
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
  const [subCategories, setSubCategories] = useState<TalentSubCategory[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [heightFeetInches, setHeightFeetInches] = useState(() =>
    cmToFeetInches(talent?.heightCm ?? undefined),
  );
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  // Other talents currently marked Featured, excluding this one — used to
  // show "N of 3 slots used" and disable the checkbox before the admin
  // even submits. The API is still the real enforcer of the limit.
  const [otherFeaturedCount, setOtherFeaturedCount] = useState(0);

  useEffect(() => {
    listAllActiveCities()
      .then(setCities)
      .catch(() => setCities([]));
    listAllActiveCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    listAllActiveSubCategories()
      .then(setSubCategories)
      .catch(() => setSubCategories([]));
    listTalent({ isFeatured: true, perPage: 100 })
      .then((result) =>
        setOtherFeaturedCount(
          result.items.filter((item) => item.id !== talent?.id).length,
        ),
      )
      .catch(() => setOtherFeaturedCount(0));
    // talent is a route-level prop that's fixed for this component's whole
    // lifetime (Add vs Edit are separate mounts) — re-running this on
    // every render it's referenced in would just re-fetch the same
    // lookups needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Same defensive pattern for the fields newly converted from free text to
  // a fixed dropdown — an existing talent's saved value may not be one of
  // the predefined options.
  const bodyTypeOptions = withCurrentValue(BODY_TYPE_OPTIONS, values.bodyType);
  const hairColourOptions = withCurrentValue(
    HAIR_COLOUR_OPTIONS,
    values.hairColour,
  );
  const hairLengthOptions = withCurrentValue(
    HAIR_LENGTH_OPTIONS,
    values.hairLength,
  );
  const generalAvailabilityOptions = withCurrentValue(
    GENERAL_AVAILABILITY_OPTIONS,
    values.generalAvailability,
  );

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

  function addCategory(categoryId: string) {
    setValues((prev) => {
      const current = prev.categoryIds ?? [];
      if (current.includes(categoryId)) return prev;
      return { ...prev, categoryIds: [...current, categoryId] };
    });
  }

  function removeCategory(categoryId: string) {
    setValues((prev) => ({
      ...prev,
      categoryIds: (prev.categoryIds ?? []).filter((id) => id !== categoryId),
      // Drop any selected sub-categories that belonged to the category
      // being removed — a sub-category shouldn't outlive its parent.
      subCategoryIds: (prev.subCategoryIds ?? []).filter(
        (id) =>
          subCategories.find((sc) => sc.id === id)?.categoryId !== categoryId,
      ),
    }));
  }

  function addSubCategory(subCategoryId: string) {
    setValues((prev) => {
      const current = prev.subCategoryIds ?? [];
      if (current.includes(subCategoryId)) return prev;
      return { ...prev, subCategoryIds: [...current, subCategoryId] };
    });
  }

  function removeSubCategory(subCategoryId: string) {
    setValues((prev) => ({
      ...prev,
      subCategoryIds: (prev.subCategoryIds ?? []).filter(
        (id) => id !== subCategoryId,
      ),
    }));
  }

  function addLanguage(language: string) {
    if (!language) return;
    setValues((prev) => {
      const current = prev.languages ?? [];
      if (current.includes(language)) return prev;
      return { ...prev, languages: [...current, language] };
    });
  }

  function removeLanguage(language: string) {
    setValues((prev) => ({
      ...prev,
      languages: (prev.languages ?? []).filter((l) => l !== language),
    }));
  }

  function addPreferredCity(cityId: string) {
    setValues((prev) => {
      const current = prev.preferredCityIds ?? [];
      if (current.includes(cityId)) return prev;
      return { ...prev, preferredCityIds: [...current, cityId] };
    });
  }

  function removePreferredCity(cityId: string) {
    setValues((prev) => ({
      ...prev,
      preferredCityIds: (prev.preferredCityIds ?? []).filter(
        (id) => id !== cityId,
      ),
    }));
  }

  function updateHeight(next: Partial<typeof heightFeetInches>) {
    const merged = { ...heightFeetInches, ...next };
    setHeightFeetInches(merged);
    update("heightCm", feetInchesToCm(merged.feet, merged.inches));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setStatus("submitting");

    const payload: TalentFormValues = { ...values };

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

        <Field label="Preferred areas" htmlFor="talent-preferred-areas">
          <ChipMultiSelect
            id="talent-preferred-areas"
            options={cityOptions.map((city) => ({
              value: city.id,
              label: `${city.name}, ${city.state}`,
            }))}
            selected={values.preferredCityIds ?? []}
            onAdd={addPreferredCity}
            onRemove={removePreferredCity}
            placeholder="Add a preferred area"
            emptyMessage="No cities available"
          />
        </Field>

        <Field label="Available for outside" htmlFor="talent-available-outside">
          <div
            id="talent-available-outside"
            className="flex items-center gap-6 py-2.5"
          >
            <label className="flex items-center gap-2 text-[13.5px] text-porcelain/80">
              <input
                type="radio"
                name="available-outside"
                checked={values.availableOutside === true}
                onChange={() => update("availableOutside", true)}
                className="h-4 w-4 accent-brass-deep"
              />
              Yes
            </label>
            <label className="flex items-center gap-2 text-[13.5px] text-porcelain/80">
              <input
                type="radio"
                name="available-outside"
                checked={!values.availableOutside}
                onChange={() => update("availableOutside", false)}
                className="h-4 w-4 accent-brass-deep"
              />
              No
            </label>
          </div>
        </Field>
      </section>

      <hr className="border-white/10" />

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="col-span-full font-display text-lg font-semibold text-porcelain">
          Basic Details &amp; Measurements
        </h2>

        <Field
          label="Languages"
          htmlFor="talent-languages"
          className="sm:col-span-2"
        >
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {(values.languages ?? []).map((language) => (
                <span
                  key={language}
                  className="inline-flex items-center gap-1.5 rounded-full border border-brass bg-brass-deep/20 px-3 py-1 text-[12.5px] text-brass"
                >
                  {language}
                  <button
                    type="button"
                    onClick={() => removeLanguage(language)}
                    aria-label={`Remove ${language}`}
                    className="text-brass/70 hover:text-brass"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <select
              id="talent-languages"
              value=""
              onChange={(event) => addLanguage(event.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Add a language
              </option>
              {LANGUAGE_OPTIONS.filter(
                (language) => !(values.languages ?? []).includes(language),
              ).map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
          </div>
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

        <Field label="Height (feet, inches)" htmlFor="talent-height-feet">
          <div className="flex items-center gap-2">
            <select
              id="talent-height-feet"
              value={heightFeetInches.feet}
              onChange={(event) =>
                updateHeight({
                  feet: event.target.value ? Number(event.target.value) : "",
                })
              }
              className={inputClass}
            >
              <option value="">ft</option>
              {FEET_OPTIONS.map((feet) => (
                <option key={feet} value={feet}>
                  {feet}′
                </option>
              ))}
            </select>
            <select
              id="talent-height-inches"
              value={heightFeetInches.inches}
              onChange={(event) =>
                updateHeight({
                  inches: event.target.value ? Number(event.target.value) : "",
                })
              }
              className={inputClass}
            >
              <option value="">in</option>
              {INCHES_OPTIONS.map((inches) => (
                <option key={inches} value={inches}>
                  {inches}″
                </option>
              ))}
            </select>
          </div>
        </Field>

        <Field label="Weight (kg)" htmlFor="talent-weight">
          <input
            id="talent-weight"
            type="number"
            min={20}
            max={300}
            value={values.weightKg ?? ""}
            onChange={(event) =>
              update(
                "weightKg",
                event.target.value ? Number(event.target.value) : undefined,
              )
            }
            className={inputClass}
          />
        </Field>

        <Field label="Body type" htmlFor="talent-body-type">
          <select
            id="talent-body-type"
            value={values.bodyType ?? ""}
            onChange={(event) => update("bodyType", event.target.value)}
            className={inputClass}
          >
            <option value="">Select body type</option>
            {bodyTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Dress size" htmlFor="talent-dress-size">
          <input
            id="talent-dress-size"
            value={values.dressSize ?? ""}
            onChange={(event) => update("dressSize", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Chest" htmlFor="talent-chest">
          <input
            id="talent-chest"
            value={values.chest ?? ""}
            onChange={(event) => update("chest", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Waist" htmlFor="talent-waist">
          <input
            id="talent-waist"
            value={values.waist ?? ""}
            onChange={(event) => update("waist", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Hip" htmlFor="talent-hip">
          <input
            id="talent-hip"
            value={values.hip ?? ""}
            onChange={(event) => update("hip", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Hair colour" htmlFor="talent-hair-colour">
          <select
            id="talent-hair-colour"
            value={values.hairColour ?? ""}
            onChange={(event) => update("hairColour", event.target.value)}
            className={inputClass}
          >
            <option value="">Select hair colour</option>
            {hairColourOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Hair length" htmlFor="talent-hair-length">
          <select
            id="talent-hair-length"
            value={values.hairLength ?? ""}
            onChange={(event) => update("hairLength", event.target.value)}
            className={inputClass}
          >
            <option value="">Select hair length</option>
            {hairLengthOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
          <select
            id="talent-general-availability"
            value={values.generalAvailability ?? ""}
            onChange={(event) =>
              update("generalAvailability", event.target.value)
            }
            className={inputClass}
          >
            <option value="">Select availability</option>
            {generalAvailabilityOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="col-span-full font-display text-lg font-semibold text-porcelain">
          Categories
        </h2>

        <Field label="Categories" htmlFor="talent-categories">
          <ChipMultiSelect
            id="talent-categories"
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            selected={values.categoryIds ?? []}
            onAdd={addCategory}
            onRemove={removeCategory}
            placeholder="Add a category"
            emptyMessage="No categories available"
          />
        </Field>

        <Field label="Sub-categories" htmlFor="talent-subcategories">
          <ChipMultiSelect
            id="talent-subcategories"
            options={subCategories
              .filter((subCategory) =>
                (values.categoryIds ?? []).includes(subCategory.categoryId),
              )
              .map((subCategory) => ({
                value: subCategory.id,
                label:
                  (values.categoryIds ?? []).length > 1
                    ? `${subCategory.name} (${
                        categories.find((c) => c.id === subCategory.categoryId)
                          ?.name ?? ""
                      })`
                    : subCategory.name,
              }))}
            selected={values.subCategoryIds ?? []}
            onAdd={addSubCategory}
            onRemove={removeSubCategory}
            placeholder="Add a sub-category"
            emptyMessage={
              (values.categoryIds ?? []).length === 0
                ? "Select a category first"
                : "No sub-categories for the selected categories"
            }
          />
        </Field>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="col-span-full font-display text-lg font-semibold text-porcelain">
          Connections
        </h2>

        <Field label="Mobile" htmlFor="talent-mobile">
          <input
            id="talent-mobile"
            value={values.mobile ?? ""}
            onChange={(event) => update("mobile", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Mobile 2" htmlFor="talent-mobile-2">
          <input
            id="talent-mobile-2"
            value={values.mobile2 ?? ""}
            onChange={(event) => update("mobile2", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="WhatsApp" htmlFor="talent-whatsapp">
          <input
            id="talent-whatsapp"
            value={values.whatsapp ?? ""}
            onChange={(event) => update("whatsapp", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Telegram" htmlFor="talent-telegram">
          <input
            id="talent-telegram"
            value={values.telegram ?? ""}
            onChange={(event) => update("telegram", event.target.value)}
            className={inputClass}
          />
        </Field>

        <Field
          label="Others"
          htmlFor="talent-other-contact"
          className="sm:col-span-2"
        >
          <input
            id="talent-other-contact"
            value={values.otherContact ?? ""}
            onChange={(event) => update("otherContact", event.target.value)}
            className={inputClass}
          />
        </Field>
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
          <div className="flex items-center gap-2">
            <Checkbox
              label="Featured"
              checked={values.isFeatured ?? false}
              disabled={
                !values.isFeatured && otherFeaturedCount >= MAX_FEATURED
              }
              onChange={(checked) => update("isFeatured", checked)}
            />
            <span className="text-[12.5px] text-porcelain/50">
              (
              {Math.min(
                otherFeaturedCount + (values.isFeatured ? 1 : 0),
                MAX_FEATURED,
              )}{" "}
              of {MAX_FEATURED} slots used)
            </span>
          </div>
        </div>
        {!values.isFeatured && otherFeaturedCount >= MAX_FEATURED ? (
          <p className="text-[12.5px] text-porcelain/50 sm:col-span-2">
            All {MAX_FEATURED} featured slots are taken — unfeature another
            talent first to feature this one.
          </p>
        ) : null}
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
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={[
        "flex items-center gap-2 text-[13.5px]",
        disabled ? "cursor-not-allowed text-porcelain/40" : "text-porcelain/80",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-brass-deep disabled:cursor-not-allowed"
      />
      {label}
    </label>
  );
}
