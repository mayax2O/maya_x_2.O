"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
  /** Renders as a collapsible dropdown (click the label to expand/collapse)
   * instead of an always-visible section — for groups like "Page" that
   * will grow over time and don't need to be visible by default. */
  collapsible?: boolean;
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/",
        label: "Dashboard",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-5 w-5"
          >
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        href: "/talent",
        label: "Talent",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-5 w-5"
          >
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
          </svg>
        ),
      },
      {
        href: "/media",
        label: "Media Library",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-5 w-5"
          >
            <rect x="3" y="4" width="18" height="14" rx="2" />
            <circle cx="8.5" cy="9.5" r="1.75" />
            <path d="m4 16 4.5-4.5a2 2 0 0 1 2.8 0L15 15l1.2-1.2a2 2 0 0 1 2.8 0L21 16" />
          </svg>
        ),
      },
      {
        href: "/categories",
        label: "Categories",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-5 w-5"
          >
            <path d="M12 3l2.6 5.7 6.2.6-4.7 4.2 1.4 6.1L12 16.7 6.5 19.6l1.4-6.1-4.7-4.2 6.2-.6z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Directory",
    items: [
      {
        href: "/cities",
        label: "Cities",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-5 w-5"
          >
            <path d="M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        ),
      },
      {
        href: "/locations",
        label: "Locations",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-5 w-5"
          >
            <path d="M4 5h16M4 12h10M4 19h16" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        href: "/bookings",
        label: "Bookings",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-5 w-5"
          >
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M8 3v4M16 3v4M4 10h16M9 14l2 2 4-4" />
          </svg>
        ),
      },
      {
        href: "/membership",
        label: "Membership",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-5 w-5"
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="8" cy="12" r="2" />
            <path d="M13 10h5M13 14h3" />
          </svg>
        ),
      },
      {
        href: "/payments",
        label: "Payments",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-5 w-5"
          >
            <rect x="3" y="6" width="18" height="12" rx="2" />
            <path d="M3 10h18" />
            <path d="M7 15h4" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Page",
    collapsible: true,
    items: [
      {
        href: "/hero",
        label: "Home Page",
        icon: (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-5 w-5"
          >
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 15l4.5-4.5a2 2 0 0 1 2.8 0L14 14" />
            <circle cx="15.5" cy="8.5" r="1.5" />
          </svg>
        ),
      },
    ],
  },
];

function NavBadge({ count, collapsed }: { count: number; collapsed: boolean }) {
  if (count <= 0) return null;
  const display = count > 99 ? "99+" : String(count);
  return (
    <span
      aria-label={`${count} pending`}
      className={[
        "flex items-center justify-center rounded-full bg-brass px-1.5 py-0.5 text-[11px] font-semibold leading-none text-ink",
        collapsed
          ? "absolute right-1.5 top-1.5 min-w-[16px] px-1 py-[3px] text-[9px]"
          : "",
      ].join(" ")}
    >
      {display}
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={[
        "h-3.5 w-3.5 shrink-0 transition-transform",
        open ? "rotate-90" : "",
      ].join(" ")}
      aria-hidden="true"
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function Sidebar({
  collapsed,
  onNavigate,
  badges = {},
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  /** Map of nav item `href` to a pending-count badge, e.g. `{ "/bookings": 3 }`. */
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    // Start expanded if the current route already lives inside it.
    const initial = new Set<string>();
    for (const section of NAV_SECTIONS) {
      if (
        section.collapsible &&
        section.items.some((item) => pathname.startsWith(item.href))
      ) {
        initial.add(section.label);
      }
    }
    return initial;
  });

  function toggleSection(label: string) {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  return (
    <nav aria-label="Primary" className="flex h-full flex-col gap-1 p-3">
      <div
        className={[
          "mb-4 flex items-center px-2 py-2",
          collapsed ? "justify-center" : "",
        ].join(" ")}
      >
        <span className="font-display text-xl font-semibold text-porcelain">
          {collapsed ? (
            <span className="italic text-brass">X</span>
          ) : (
            <>
              MAYA<span className="italic text-brass">X</span>
            </>
          )}
        </span>
      </div>

      {NAV_SECTIONS.map((section, index) => {
        const isOpen = !section.collapsible || openSections.has(section.label);
        return (
          <div
            key={section.label}
            className={index === 0 ? "" : "mt-3 border-t border-white/10 pt-3"}
          >
            {collapsed ? null : section.collapsible ? (
              <button
                type="button"
                onClick={() => toggleSection(section.label)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-porcelain/40 hover:text-porcelain/70"
              >
                {section.label}
                <ChevronIcon open={isOpen} />
              </button>
            ) : (
              <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-porcelain/40">
                {section.label}
              </div>
            )}
            {!isOpen && !collapsed
              ? null
              : section.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  const badgeCount = badges[item.href] ?? 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={[
                        "relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-medium transition-colors",
                        collapsed ? "justify-center" : "",
                        isActive
                          ? "bg-brass-deep/20 text-brass"
                          : "text-porcelain/70 hover:bg-white/5 hover:text-porcelain",
                      ].join(" ")}
                    >
                      {item.icon}
                      {collapsed ? null : (
                        <span className="flex-1">{item.label}</span>
                      )}
                      <NavBadge count={badgeCount} collapsed={collapsed} />
                    </Link>
                  );
                })}
          </div>
        );
      })}
    </nav>
  );
}
