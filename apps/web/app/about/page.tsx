import type { Metadata } from "next";

import { AlponaMotif } from "../../components/motifs/AlponaMotif";
import { Container } from "../../components/layout/Container";
import { MediaFrame } from "../../components/media/MediaFrame";

export const metadata: Metadata = {
  title: "About | MAYA_X",
  description:
    "MAYA_X is a curated talent agency founded in Kolkata, managing every booking personally from first enquiry to final bow.",
};

const VALUES = [
  {
    title: "Curated",
    description:
      "Every talent is vetted personally; the platform never feels like an open marketplace.",
  },
  {
    title: "Composed",
    description:
      "Generous whitespace, unhurried pacing — no urgency gimmicks in how we present talent.",
  },
  {
    title: "Discreet",
    description:
      "The agency mediates every conversation; we never rush a client toward direct contact.",
  },
  {
    title: "Warm, not cold-corporate",
    description:
      "Brass and porcelain over blue-and-white SaaS default — a platform that feels hosted, not automated.",
  },
];

const STATS = [
  { label: "Talent onboarded", value: "300+" },
  { label: "Cities served", value: "6" },
  { label: "Events managed", value: "1,200+" },
  { label: "Founded", value: "Kolkata, 2019" },
];

export default function AboutPage() {
  return (
    <>
      {/* Section: Our story — deliberately fixed dark in every theme
          (a bookend accent, matching Hero/Footer), so it uses literal hex
          values instead of the theme-aware ink/porcelain tokens. */}
      <section className="bg-[#12141c] text-[#f3f4f6]">
        <Container className="flex flex-col gap-6 py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-tint/80">
            Our story
          </p>
          <h1 className="max-w-2xl font-display text-3xl font-semibold sm:text-4xl">
            Born in Kolkata, built for every stage in India.
          </h1>
          <p className="max-w-2xl text-[15.5px] leading-relaxed text-[#f3f4f6]/70">
            MAYA_X began in Kolkata&apos;s own festival season — the weeks
            around Durga Puja, when every event, pandal, and stage in the city
            needs verified talent at once. We built the agency discipline that
            heavy season demands, then brought it to clients year-round across
            India.
          </p>
          <AlponaMotif className="h-8 w-56 text-brass/60" />
        </Container>
      </section>

      {/* Section: Values grid */}

      <section aria-labelledby="values-heading" className="py-16 sm:py-20">
        <Container>
          <h2
            id="values-heading"
            className="font-display text-3xl font-semibold text-ink"
          >
            What we stand for
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2" role="list">
            {VALUES.map((value) => (
              <li
                key={value.title}
                className="rounded-lg bg-porcelain p-6 ring-1 ring-ink/5"
              >
                <h3 className="font-display text-lg font-semibold text-ink">
                  {value.title}
                </h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-slate">
                  {value.description}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section
        aria-labelledby="stats-heading"
        className="bg-porcelain-soft py-16 sm:py-20"
      >
        <Container>
          <h2 id="stats-heading" className="sr-only">
            MAYA_X in numbers
          </h2>
          <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="text-[13px] font-semibold uppercase tracking-widest text-slate">
                  {stat.label}
                </dt>
                <dd className="mt-2 font-display text-3xl font-semibold text-ink">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section aria-labelledby="heritage-heading" className="py-16 sm:py-20">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2
              id="heritage-heading"
              className="font-display text-3xl font-semibold text-ink"
            >
              Rooted in Bengali craft and hospitality
            </h2>
            <p className="mt-4 max-w-prose text-[15.5px] leading-relaxed text-ink/85">
              Kolkata&apos;s own traditions of hosting — the adda, the pandal,
              the wedding sangeet — shaped how we think about events: unhurried,
              personal, and never transactional. That same care now travels with
              every talent we place, in any city.
            </p>
          </div>
          <MediaFrame
            src="/mock/about/heritage.jpg"
            alt="Alpona-style floor art at a Kolkata pandal"
            aspect="wide"
          />
        </Container>
      </section>
    </>
  );
}
