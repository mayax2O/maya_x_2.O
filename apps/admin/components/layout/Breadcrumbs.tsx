"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  talent: "Talent",
  cities: "Cities",
  locations: "Locations",
  categories: "Categories",
  subcategories: "Sub-categories",
  new: "New",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return <span className="text-[13.5px] text-porcelain/60">Dashboard</span>;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[13.5px] text-porcelain/60"
    >
      <Link href="/" className="hover:text-porcelain">
        Dashboard
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = LABELS[segment] ?? decodeURIComponent(segment);
        return (
          <span key={href} className="flex items-center gap-1.5">
            <span aria-hidden="true">/</span>
            {isLast ? (
              <span className="text-porcelain">{label}</span>
            ) : (
              <Link href={href} className="hover:text-porcelain">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
