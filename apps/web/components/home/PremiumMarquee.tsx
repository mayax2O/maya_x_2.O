import type { Talent } from "../../lib/types";
import { TalentCard } from "../talent/TalentCard";

// One copy of the track must be at least this many cards wide, or a short
// roster (1–2 premium talents) leaves a visible gap mid-loop instead of an
// unbroken rail. The list is repeated up to this length, then the whole
// thing is rendered twice so the -50% translate lands seamlessly.
const MIN_CARDS_PER_LOOP = 8;
// Seconds each card spends crossing the rail — multiplied by the card
// count so a long roster scrolls at the same pace as a short one rather
// than sprinting.
const SECONDS_PER_CARD = 6;

/**
 * Continuously scrolling rail of premium talent. Pure CSS (see
 * .maya-marquee in globals.css) so this stays a server component — no
 * client JS, no hydration cost. Pauses on hover/focus, and collapses to a
 * plain horizontally-scrollable strip under prefers-reduced-motion.
 */
export function PremiumMarquee({ talents }: { talents: Talent[] }) {
  if (talents.length === 0) return null;

  const repeats = Math.max(1, Math.ceil(MIN_CARDS_PER_LOOP / talents.length));
  const loop = Array.from({ length: repeats }, () => talents).flat();
  const duration = loop.length * SECONDS_PER_CARD;

  return (
    <div
      className="maya-marquee no-scrollbar relative overflow-x-auto"
      // The rail is decorative repetition of links that all appear in the
      // catalog; announcing every duplicate would spam screen readers, so
      // it's hidden from the a11y tree and the section's "View all talent"
      // link is the accessible path to the same content.
      aria-hidden
    >
      <ul
        className="maya-marquee-track flex gap-5"
        style={{ ["--marquee-duration" as string]: `${duration}s` }}
      >
        {[...loop, ...loop].map((talent, index) => (
          <li
            key={`${talent.id}-${index}`}
            className="w-[260px] shrink-0 sm:w-[280px]"
          >
            <TalentCard talent={talent} />
          </li>
        ))}
      </ul>
    </div>
  );
}
