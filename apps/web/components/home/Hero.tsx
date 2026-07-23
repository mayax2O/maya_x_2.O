import { AlponaMotif } from "../motifs/AlponaMotif";
import { SearchBar } from "../search/SearchBar";
import { Container } from "../layout/Container";

// Section: Hero — deliberately fixed dark in every theme (a bookend accent
// against the surrounding light content), so it uses literal hex values
// instead of the theme-aware ink/porcelain tokens.
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#12141c] text-[#f3f4f6]">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#12141c] via-[#1c1f29] to-brass-deep/30"
        aria-hidden="true"
      />
      <Container className="relative flex flex-col gap-8 py-20 sm:py-28">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass-tint/80">
          Curated talent, from Kolkata to every stage in India
        </p>
        <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
          Discover verified talent, agency-managed from first enquiry to final
          bow.
        </h1>
        <p className="max-w-xl text-[16.5px] leading-relaxed text-[#f3f4f6]/70">
          Event hosts, classical performers, brand ambassadors, and live
          musicians — every profile personally vetted, every booking mediated by
          our team.
        </p>
        <div className="max-w-xl">
          <SearchBar />
        </div>
        <AlponaMotif className="mt-4 h-8 w-56 text-brass/60" />
      </Container>
    </section>
  );
}
