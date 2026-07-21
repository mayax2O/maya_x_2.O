"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { TalentAvailability, TalentCategory } from "../../lib/types";

const AVAILABILITY_OPTIONS: { value: TalentAvailability; label: string }[] = [
  { value: "available", label: "Available" },
  { value: "limited", label: "Limited availability" },
  { value: "unavailable", label: "Unavailable" },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "rating", label: "Highest rated" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

export function Filters({
  categories,
  cities,
}: {
  categories: TalentCategory[];
  cities: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/talent?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-white p-5 ring-1 ring-ink/5">
      <div>
        <h2 className="text-[13px] font-semibold uppercase tracking-widest text-slate">
          Category
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-[14.5px] text-ink">
            <input
              type="radio"
              name="category"
              checked={!searchParams.get("category")}
              onChange={() => updateParam("category", "")}
              className="h-4 w-4 accent-brass-deep"
            />
            All categories
          </label>
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center gap-2 text-[14.5px] text-ink"
            >
              <input
                type="radio"
                name="category"
                value={category.slug}
                checked={searchParams.get("category") === category.slug}
                onChange={(event) =>
                  updateParam("category", event.target.value)
                }
                className="h-4 w-4 accent-brass-deep"
              />
              {category.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="filter-city"
          className="text-[13px] font-semibold uppercase tracking-widest text-slate"
        >
          City
        </label>
        <select
          id="filter-city"
          value={searchParams.get("city") ?? ""}
          onChange={(event) => updateParam("city", event.target.value)}
          className="mt-3 w-full rounded-md border border-slate/30 bg-white px-3 py-2 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
        >
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h2 className="text-[13px] font-semibold uppercase tracking-widest text-slate">
          Availability
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-[14.5px] text-ink">
            <input
              type="radio"
              name="availability"
              checked={!searchParams.get("availability")}
              onChange={() => updateParam("availability", "")}
              className="h-4 w-4 accent-brass-deep"
            />
            Any
          </label>
          {AVAILABILITY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-[14.5px] text-ink"
            >
              <input
                type="radio"
                name="availability"
                value={option.value}
                checked={searchParams.get("availability") === option.value}
                onChange={(event) =>
                  updateParam("availability", event.target.value)
                }
                className="h-4 w-4 accent-brass-deep"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label
          htmlFor="filter-sort"
          className="text-[13px] font-semibold uppercase tracking-widest text-slate"
        >
          Sort by
        </label>
        <select
          id="filter-sort"
          value={searchParams.get("sort") ?? "featured"}
          onChange={(event) => updateParam("sort", event.target.value)}
          className="mt-3 w-full rounded-md border border-slate/30 bg-white px-3 py-2 text-[14.5px] text-ink focus:border-brass-deep focus:outline-none"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
