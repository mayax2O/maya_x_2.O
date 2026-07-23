"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

// Component: Talent search bar — used in Hero and atop the Talent listing page.
export function SearchBar({
  initialQuery = "",
  className,
}: {
  initialQuery?: string;
  className?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/talent${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={[
        "flex w-full items-center gap-2 rounded-lg bg-porcelain p-2 shadow-sm ring-1 ring-ink/10",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <label htmlFor="talent-search" className="sr-only">
        Search talent by name, category, or city
      </label>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-2 h-5 w-5 shrink-0 text-slate"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="M20 20l-4.5-4.5" />
      </svg>
      <input
        id="talent-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search talent, category, or city"
        className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[15px] text-ink placeholder:text-slate/70 focus:outline-none"
      />
      <button
        type="submit"
        className="inline-flex items-center whitespace-nowrap rounded-md bg-brass-deep px-5 py-2.5 text-[14.5px] font-semibold text-white transition hover:bg-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-deep"
      >
        Search
      </button>
    </form>
  );
}
