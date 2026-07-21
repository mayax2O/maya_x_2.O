"use client";

import { useEffect, useRef, useState } from "react";

import { getDashboardStats } from "../../lib/data/dashboard";
import type { RecentActivityItem } from "../../lib/types";

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || items.length > 0) return;
    setLoading(true);
    getDashboardStats()
      .then((stats) => setItems(stats.recentActivity))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [isOpen, items.length]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Notifications"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-porcelain/70 hover:bg-white/5 hover:text-porcelain"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="h-5 w-5"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 12 6 8z" />
          <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
        </svg>
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-lg border border-white/10 bg-ink-soft shadow-xl"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[13.5px] font-medium text-porcelain">
              Recent activity
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-[13px] text-porcelain/50">
                Loading…
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-porcelain/50">
                No recent activity.
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="border-b border-white/5 px-4 py-3 last:border-0"
                >
                  <p className="text-[13px] text-porcelain/85">
                    {item.description}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-porcelain/45">
                    {timeAgo(item.occurredAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
