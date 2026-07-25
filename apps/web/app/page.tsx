import Link from "next/link";
import type { Metadata } from "next";

import { Container } from "../components/layout/Container";
import { Faq } from "../components/home/Faq";
import { FeaturedPromoCard } from "../components/home/FeaturedPromoCard";
import { Hero } from "../components/home/Hero";
import { PremiumMarquee } from "../components/home/PremiumMarquee";
import { Testimonials } from "../components/home/Testimonials";
import { MembershipTeaser } from "../components/membership/MembershipTeaser";
import { TalentCard } from "../components/talent/TalentCard";
import { getFaqs } from "../lib/data/faqs";
import { getHeroSettings } from "../lib/data/hero";
import { getFeaturedTalents, getPremiumTalents } from "../lib/data/talents";
import { getTestimonials } from "../lib/data/testimonials";

export const metadata: Metadata = {
  title: "MAYA_X — Premium Talent Platform",
  description:
    "Discover verified, agency-managed professional talent for events across India — event hosts, classical performers, brand ambassadors, and live musicians, founded in Kolkata.",
};

// Hero's background is admin-controlled (real API data, unlike the rest of
// this page's mock content) — force-dynamic so a change shows up on the
// next request instead of only after the next static rebuild/deploy.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredTalents, premiumTalents, testimonials, faqs, heroSettings] =
    await Promise.all([
      getFeaturedTalents(3),
      getPremiumTalents(),
      getTestimonials(3),
      getFaqs(),
      getHeroSettings(),
    ]);

  return (
    <>
      {/* Section: Hero */}
      <Hero mode={heroSettings.mode} media={heroSettings.media} />

      {/* Section: Featured Talent grid */}
      <section aria-labelledby="featured-heading" className="py-16 sm:py-20">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-widest text-brass-deep">
                Featured
              </p>
              <h2
                id="featured-heading"
                className="mt-2 font-display text-3xl font-semibold text-ink"
              >
                In demand this season
              </h2>
            </div>
            <Link
              href="/talent"
              className="hidden text-[14.5px] font-semibold text-brass-deep hover:text-brass sm:inline"
            >
              View all talent →
            </Link>
          </div>
          {/* 3:2 split — the talent trio (left) is wider than the promo
              card (right). Below `lg` they stack, and the talent row
              becomes a full-width horizontal swipe strip instead of a
              cramped 3-up grid. */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
            <ul
              className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 lg:col-span-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:pb-0"
              role="list"
            >
              {featuredTalents.map((talent) => (
                <li
                  key={talent.id}
                  className="w-[78%] shrink-0 snap-start sm:w-[42%] lg:w-auto"
                >
                  <TalentCard talent={talent} />
                </li>
              ))}
            </ul>
            <div className="lg:col-span-2">
              <FeaturedPromoCard />
            </div>
          </div>
          <Link
            href="/talent"
            className="mt-6 block text-center text-[14.5px] font-semibold text-brass-deep hover:text-brass sm:hidden"
          >
            View all talent →
          </Link>
        </Container>
      </section>

      {/* Section: Premium talent — a continuously scrolling rail, sitting
          directly below Featured. Renders nothing at all when no talent is
          marked premium, rather than leaving an empty headed section. */}
      {premiumTalents.length > 0 ? (
        <section
          aria-labelledby="premium-heading"
          className="bg-porcelain-soft py-16 sm:py-20"
        >
          <Container>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-widest text-brass-deep">
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                    aria-hidden
                  >
                    <path d="M12 3l2.6 5.7 6.2.6-4.7 4.2 1.4 6.1L12 16.7 6.5 19.6l1.4-6.1-4.7-4.2 6.2-.6z" />
                  </svg>
                  Premium
                </p>
                <h2
                  id="premium-heading"
                  className="mt-2 font-display text-3xl font-semibold text-ink"
                >
                  Our premium roster
                </h2>
              </div>
              <Link
                href="/talent"
                className="hidden text-[14.5px] font-semibold text-brass-deep hover:text-brass sm:inline"
              >
                View all talent →
              </Link>
            </div>
          </Container>
          {/* Full-bleed: the rail runs edge to edge, so it sits outside
              Container's horizontal padding. */}
          <div className="mt-8">
            <PremiumMarquee talents={premiumTalents} />
          </div>
        </section>
      ) : null}

      {/* Section: Membership teaser */}
      <section
        aria-labelledby="membership-heading"
        className="bg-porcelain-soft py-16 sm:py-20"
      >
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[13px] font-semibold uppercase tracking-widest text-brass-deep">
              Membership
            </p>
            <h2
              id="membership-heading"
              className="mt-2 font-display text-3xl font-semibold text-ink"
            >
              Priority review, every time
            </h2>
            <p className="mt-3 text-[15px] text-slate">
              Members skip the standard review queue and get first access to
              member-only talent.
            </p>
          </div>
          <MembershipTeaser />
        </Container>
      </section>

      {/* Section: Testimonials */}
      <section
        aria-labelledby="testimonials-heading"
        className="py-16 sm:py-20"
      >
        <Container>
          <h2
            id="testimonials-heading"
            className="font-display text-3xl font-semibold text-ink"
          >
            Trusted by event teams across India
          </h2>
          <div className="mt-8">
            <Testimonials testimonials={testimonials} />
          </div>
        </Container>
      </section>

      {/* Section: FAQ */}
      <section
        aria-labelledby="faq-heading"
        className="bg-porcelain-soft py-16 sm:py-20"
      >
        <Container className="max-w-3xl">
          <h2
            id="faq-heading"
            className="font-display text-3xl font-semibold text-ink"
          >
            Frequently asked questions
          </h2>
          <div className="mt-8">
            <Faq items={faqs.slice(0, 5)} />
          </div>
        </Container>
      </section>

      {/* Section: Closing CTA — deliberately fixed dark in every theme
          (a bookend accent, matching Hero/Footer), so it uses literal hex
          values instead of the theme-aware ink/porcelain tokens. */}
      <section className="bg-[#12141c] py-16 text-[#f3f4f6] sm:py-20">
        <Container className="flex flex-col items-center gap-5 text-center">
          <h2 className="font-display text-3xl font-semibold">
            Ready to plan your event?
          </h2>
          <p className="max-w-lg text-[15px] text-[#f3f4f6]/70">
            Tell us what you need and our team will recommend the right talent
            within one business day.
          </p>
          <Link
            href="/quick-booking"
            className="inline-flex items-center rounded-md bg-brass-deep px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-brass"
          >
            Start a Quick Booking
          </Link>
        </Container>
      </section>
    </>
  );
}
