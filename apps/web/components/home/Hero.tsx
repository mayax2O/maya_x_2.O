import { AlponaMotif } from "../motifs/AlponaMotif";
import { SearchBar } from "../search/SearchBar";
import { Container } from "../layout/Container";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink text-porcelain">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-ink via-ink-soft to-brass-deep/30"
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
        <p className="max-w-xl text-[16.5px] leading-relaxed text-porcelain/70">
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
