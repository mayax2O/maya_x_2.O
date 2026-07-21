import Link from "next/link";

import { AlponaMotif } from "../motifs/AlponaMotif";
import { Container } from "./Container";

const FOOTER_COLUMNS: {
  title: string;
  links: { href: string; label: string }[];
}[] = [
  {
    title: "Explore",
    links: [
      { href: "/talent", label: "Talent" },
      { href: "/membership", label: "Membership" },
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/register", label: "Register" },
      { href: "/quick-booking", label: "Quick Booking" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink/10 bg-ink text-porcelain/80">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-2xl font-semibold text-porcelain">
              MAYA<span className="italic text-brass">X</span>
            </p>
            <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-porcelain/60">
              Founded in Kolkata, MAYA_X curates and manages verified
              professional talent for events across India — every booking
              mediated personally by our agency team.
            </p>
            <AlponaMotif className="mt-6 h-6 w-40 text-brass/50" />
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-[13px] font-semibold uppercase tracking-widest text-porcelain/50">
                {column.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[14.5px] text-porcelain/70 hover:text-porcelain"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-porcelain/10 pt-6 text-[13px] text-porcelain/50 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} MAYA_X. All rights reserved.</p>
          <p>
            Kolkata &middot; Mumbai &middot; Delhi &middot; Bengaluru &middot;
            Chennai
          </p>
        </div>
      </Container>
    </footer>
  );
}
