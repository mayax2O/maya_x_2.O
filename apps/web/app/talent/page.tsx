import type { Metadata } from "next";

import { Container } from "../../components/layout/Container";
import { Filters } from "../../components/search/Filters";
import { SearchBar } from "../../components/search/SearchBar";
import { TalentCard } from "../../components/talent/TalentCard";
import { getTalentCategories } from "../../lib/data/categories";
import { getCities, getTalents } from "../../lib/data/talents";
import type { TalentAvailability, TalentFilters } from "../../lib/types";

export const metadata: Metadata = {
  title: "Talent Listing | MAYA_X",
  description:
    "Browse verified, agency-managed talent across event hosting, classical performance, brand ambassador work, and live music.",
};

type SearchParams = {
  q?: string;
  category?: string;
  city?: string;
  availability?: string;
  sort?: string;
};

export default async function TalentListingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const [talents, categories, cities] = await Promise.all([
    getTalents({
      query: params.q,
      categorySlug: params.category,
      city: params.city,
      availability: params.availability as TalentAvailability | undefined,
      sort: params.sort as TalentFilters["sort"],
    }),
    getTalentCategories(),
    getCities(),
  ]);

  return (
    <Container className="py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-[13px] font-semibold uppercase tracking-widest text-brass-deep">
          Talent Catalog
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Find the right talent for your event
        </h1>
      </div>

      <div className="mt-6 lg:hidden">
        <SearchBar initialQuery={params.q} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="mb-4">
            <SearchBar initialQuery={params.q} />
          </div>
          <Filters categories={categories} cities={cities} />
        </aside>

        <div className="lg:hidden">
          <Filters categories={categories} cities={cities} />
        </div>

        <div>
          <p className="mb-4 text-[14px] text-slate">
            {talents.length} {talents.length === 1 ? "talent" : "talents"} found
          </p>

          {talents.length > 0 ? (
            <ul
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
              role="list"
            >
              {talents.map((talent) => (
                <li key={talent.id}>
                  <TalentCard talent={talent} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-lg bg-porcelain-soft p-8 text-center">
              <p className="font-display text-lg font-semibold text-ink">
                No talent matches those filters
              </p>
              <p className="mt-2 text-[14.5px] text-slate">
                Try clearing a filter or searching a different category or city.
              </p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}
