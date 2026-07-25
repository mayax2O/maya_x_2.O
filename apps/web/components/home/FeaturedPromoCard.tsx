import Link from "next/link";

// Copy is static for now; swap this for admin-managed content (mirroring
// Hero settings) if the promo needs to change without a redeploy.
const LEAD_PARAGRAPH =
  "Modern life often brings long work hours, ongoing stress, and a sense of emotional emptiness. Many successful men seek genuine connection, intimacy, and a way to fully relax.";
const BODY_PARAGRAPHS = [
  "Spending time with professional, open-minded escorts can provide companionship, conversation, and physical intimacy in a discreet setting. These companions offer a mix of emotional engagement and sensual experience designed to help clients feel desired, relaxed, and satisfied.",
  "If you are in Kolkata for business, studies, travel, or a short stay, arranging time with an experienced escort can make your visit more enjoyable. Instead of spending evenings alone, you can choose company that provides warmth, affection, and physical pleasure on mutually agreed terms.",
];

/**
 * The promotional slot beside the Featured talent rail — fixed dark +
 * brass in every theme (matches Hero/Footer/the closing CTA band) so it
 * reads as a distinct advertising panel rather than another content card.
 * Height is dictated by the parent grid (stretches to match the Featured
 * column) — the text block scrolls internally on its own if it ever runs
 * longer than that available height, so the CTA button always stays
 * pinned and visible rather than pushed off the bottom.
 */
export function FeaturedPromoCard() {
  return (
    <div className="flex h-full flex-col justify-between gap-6 rounded-lg bg-[#12141c] p-8 text-[#f3f4f6] shadow-[0_1px_0_rgba(255,255,255,0.06),0_30px_70px_-15px_rgba(0,0,0,0.65)] sm:p-10">
      <div className="flex-1 overflow-y-auto">
        <p className="font-display text-xl italic leading-relaxed text-brass-tint sm:text-2xl">
          {LEAD_PARAGRAPH}
        </p>
        <div className="mt-4 space-y-4 text-[14.5px] leading-relaxed text-[#f3f4f6]/70">
          {BODY_PARAGRAPHS.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
      <Link
        href="/quick-booking"
        className="inline-flex w-fit shrink-0 items-center rounded-md bg-brass-deep px-5 py-2.5 text-[14.5px] font-semibold text-white transition hover:bg-brass"
      >
        Start a Quick Booking →
      </Link>
    </div>
  );
}
