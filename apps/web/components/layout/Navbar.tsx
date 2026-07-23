"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "../../lib/auth/AuthContext";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Container } from "./Container";

const NAV_LINKS = [
  { href: "/talent", label: "Talent" },
  { href: "/membership", label: "Membership" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const { status, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const accountHref = status === "authenticated" ? "/account" : "/login";
  const accountLabel =
    status === "authenticated" ? (user?.fullName ?? "Account") : "Log in";

  return (
    // Top Menu Bar
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-porcelain/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between sm:h-20">
        <Link
          href="/"
          className="font-display text-2xl font-semibold tracking-tight text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass-deep"
          onClick={() => setIsMenuOpen(false)}
        >
          MAYA<span className="italic text-brass-deep">X</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "text-[15px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass-deep",
                  isActive ? "text-brass-deep" : "text-ink/80 hover:text-ink",
                ].join(" ")}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            href={accountHref}
            className="text-[15px] font-medium text-ink/80 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass-deep"
          >
            {accountLabel}
          </Link>
          <Link
            href="/quick-booking"
            className="inline-flex items-center rounded-md bg-brass-deep px-5 py-2.5 text-[14.5px] font-semibold text-white transition hover:bg-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-deep"
          >
            Quick Booking
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              className="h-6 w-6"
            >
              {isMenuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </Container>

      {isMenuOpen ? (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="border-t border-ink/10 bg-porcelain md:hidden"
        >
          <Container className="flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-md px-3 py-2.5 text-[15px] font-medium text-ink/80 hover:bg-porcelain-soft hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={accountHref}
              onClick={() => setIsMenuOpen(false)}
              className="rounded-md px-3 py-2.5 text-[15px] font-medium text-ink/80 hover:bg-porcelain-soft hover:text-ink"
            >
              {accountLabel}
            </Link>
            <Link
              href="/quick-booking"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-md bg-brass-deep px-5 py-2.5 text-[14.5px] font-semibold text-white hover:bg-brass"
            >
              Quick Booking
            </Link>
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
