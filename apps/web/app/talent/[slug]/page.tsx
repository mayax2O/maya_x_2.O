import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookingModal } from "../../../components/booking/BookingModal";
import { Container } from "../../../components/layout/Container";
import { MediaFrame } from "../../../components/media/MediaFrame";
import { AvailabilityBadge } from "../../../components/talent/AvailabilityBadge";
import { Gallery } from "../../../components/talent/Gallery";
import { TalentCard } from "../../../components/talent/TalentCard";
import { formatPrice } from "../../../lib/format";
import {
  getRelatedTalents,
  getTalentBySlug,
  getTalentSlugs,
} from "../../../lib/data/talents";

export async function generateStaticParams() {
  const slugs = await getTalentSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const talent = await getTalentBySlug(slug);

  if (!talent) return { title: "Talent not found | MAYA_X" };

  return {
    title: `${talent.displayName} — ${talent.tagline} | MAYA_X`,
    description: talent.bio,
  };
}

export default async function TalentProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const talent = await getTalentBySlug(slug);

  if (!talent) notFound();

  const relatedTalents = await getRelatedTalents(talent, 3);

  return (
    <Container className="py-12 sm:py-16">
      <nav aria-label="Breadcrumb" className="mb-6 text-[13.5px] text-slate">
        <Link href="/talent" className="hover:text-ink">
          Talent
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{talent.displayName}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[380px_1fr]">
        <div>
          <MediaFrame
            src={talent.coverImage.url}
            alt={talent.coverImage.alt}
            aspect="portrait"
          />
        </div>

        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
                {talent.displayName}
              </h1>
              <p className="mt-1 text-[16px] text-slate">{talent.tagline}</p>
            </div>
            <div className="flex items-center gap-1 text-[15px] font-medium text-ink">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 text-brass-deep"
                aria-hidden="true"
              >
                <path d="M12 3l2.6 5.7 6.2.6-4.7 4.2 1.4 6.1L12 16.7 6.5 19.6l1.4-6.1-4.7-4.2 6.2-.6z" />
              </svg>
              {talent.rating.toFixed(1)}
              <span className="text-slate">({talent.reviewCount} reviews)</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <AvailabilityBadge availability={talent.availability} />
            <span className="text-[14px] text-slate">{talent.city}</span>
            <span className="text-[14px] text-slate">·</span>
            <span className="text-[14px] text-slate">
              {talent.languages.join(", ")}
            </span>
          </div>

          <ul
            className="mt-4 flex flex-wrap gap-2"
            role="list"
            aria-label="Categories"
          >
            {talent.categories.map((category) => (
              <li
                key={category.id}
                className="rounded-full bg-brass-tint/40 px-3 py-1 text-[13px] font-medium text-brass-deep"
              >
                {category.name}
              </li>
            ))}
          </ul>

          <p className="mt-6 max-w-prose text-[15.5px] leading-relaxed text-ink/85">
            {talent.bio}
          </p>

          <div className="mt-8 flex flex-col gap-4 rounded-lg bg-porcelain-soft p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px] text-ink">
              Starting from{" "}
              <span className="font-display text-xl font-semibold">
                {formatPrice(talent.startingPrice, talent.currency)}
              </span>
            </p>
            <BookingModal talent={talent} />
          </div>
        </div>
      </div>

      <section aria-labelledby="gallery-heading" className="mt-14">
        <h2
          id="gallery-heading"
          className="font-display text-2xl font-semibold text-ink"
        >
          Gallery
        </h2>
        <div className="mt-6">
          <Gallery items={talent.gallery} />
        </div>
      </section>

      {relatedTalents.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-14">
          <h2
            id="related-heading"
            className="font-display text-2xl font-semibold text-ink"
          >
            You may also like
          </h2>
          <ul
            className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            role="list"
          >
            {relatedTalents.map((related) => (
              <li key={related.id}>
                <TalentCard talent={related} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Container>
  );
}
