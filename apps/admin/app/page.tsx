"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminShell } from "../components/layout/AdminShell";
import { StatCard } from "../components/dashboard/StatCard";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { getDashboardStats } from "../lib/data/dashboard";
import type { DashboardStats } from "../lib/types";

const ICONS = {
  users: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20c0-3 3-5 7-5s7 2 7 5" />
      <path d="M16 8a3 3 0 1 1 3 3" />
      <path d="M22 20c0-2.2-1.6-4-4-4.7" />
    </svg>
  ),
  talent: (
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
  check: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
    >
      <path d="M5 12l5 5L20 7" />
    </svg>
  ),
  clock: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
  calendar: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
    >
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  ),
  star: (
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
  rupee: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-5 w-5"
    >
      <path d="M6 4h12M6 9h12M6 4c5 0 8 2 8 5s-3 5-8 5l8 6" />
    </svg>
  ),
};

const QUICK_ACTIONS = [
  { href: "/talent/new", label: "Add new talent" },
  { href: "/talent", label: "Review talent catalog" },
  { href: "/cities", label: "Manage cities" },
  { href: "/categories", label: "Manage categories" },
];

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    getDashboardStats()
      .then(setStats)
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard.",
        ),
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (error) {
    return <ErrorState message={error} onRetry={load} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-porcelain">
          Dashboard
        </h1>
        <p className="mt-1 text-[14px] text-porcelain/60">
          An overview of the agency&apos;s operations.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading || !stats ? (
          Array.from({ length: 7 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))
        ) : (
          <>
            <StatCard
              label="Total Users"
              value={stats.totalUsers}
              icon={ICONS.users}
            />
            <StatCard
              label="Total Talent"
              value={stats.totalTalent}
              icon={ICONS.talent}
            />
            <StatCard
              label="Active Talent"
              value={stats.activeTalent}
              icon={ICONS.check}
            />
            <StatCard
              label="Pending Bookings"
              value={stats.pendingBookings}
              icon={ICONS.clock}
              mocked
            />
            <StatCard
              label="Today's Bookings"
              value={stats.todaysBookings}
              icon={ICONS.calendar}
              mocked
            />
            <StatCard
              label="Premium Members"
              value={stats.premiumMembers}
              icon={ICONS.star}
              mocked
            />
            <StatCard
              label="Monthly Revenue"
              value={`₹${stats.monthlyRevenue.toLocaleString("en-IN")}`}
              icon={ICONS.rupee}
              mocked
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-ink-soft p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-porcelain">
            Recent activity
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {loading || !stats ? (
              Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))
            ) : stats.recentActivity.length === 0 ? (
              <p className="text-[13.5px] text-porcelain/50">
                No activity yet.
              </p>
            ) : (
              stats.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-[13.5px] text-porcelain/85">
                    {item.description}
                  </p>
                  <p className="shrink-0 pl-4 text-[12px] text-porcelain/40">
                    {timeAgo(item.occurredAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-ink-soft p-5">
          <h2 className="font-display text-lg font-semibold text-porcelain">
            Quick actions
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-md border border-white/10 px-3 py-2.5 text-[13.5px] text-porcelain/80 hover:border-brass/40 hover:text-porcelain"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-ink-soft p-5">
        <h2 className="font-display text-lg font-semibold text-porcelain">
          Latest registrations
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {loading || !stats ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))
          ) : stats.latestRegistrations.length === 0 ? (
            <p className="text-[13.5px] text-porcelain/50">
              No registrations yet.
            </p>
          ) : (
            stats.latestRegistrations.map((registration) => (
              <div
                key={registration.id}
                className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-[13.5px] font-medium text-porcelain">
                    {registration.fullName}
                  </p>
                  <p className="text-[12.5px] text-porcelain/50">
                    {registration.email}
                  </p>
                </div>
                <p className="shrink-0 pl-4 text-[12px] text-porcelain/40">
                  {timeAgo(registration.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AdminShell>
      <DashboardContent />
    </AdminShell>
  );
}
