/**
 * Decorative line-art motif inspired by alpona — the geometric rice-paste
 * floor art used across Bengali homes and pandals for festive occasions.
 * Purely ornamental (aria-hidden): a quiet cultural accent rather than a
 * literal icon, kept to the design system's brass palette and thin-stroke
 * icon language (see docs/06-design-system §06 Icons).
 */
export function AlponaMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
      className={className}
    >
      <path d="M0 20h30" />
      <path d="M170 20h30" />
      <circle cx="100" cy="20" r="6" />
      <path d="M100 8v-4M100 36v-4M88 20h-4M116 20h4" />
      <path d="M91 11l-2.8-2.8M109 29l2.8 2.8M91 29l-2.8 2.8M109 11l2.8-2.8" />
      <path d="M60 20c6-10 12-10 18 0" />
      <path d="M122 20c6-10 12-10 18 0" />
      <circle cx="52" cy="20" r="2" />
      <circle cx="148" cy="20" r="2" />
    </svg>
  );
}
