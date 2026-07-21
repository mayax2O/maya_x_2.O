"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminShell } from "../../components/layout/AdminShell";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../lib/api/client";
import {
  listAllActiveCategories,
  listAllActiveCities,
} from "../../lib/data/lookups";
import { bulkTalent, listTalent } from "../../lib/data/talent";
import type {
  BulkAction,
  City,
  Talent,
  TalentCategory,
  TalentListFilters,
} from "../../lib/types";

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

const PER_PAGE = 20;

function TalentListContent() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Talent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<TalentListFilters>({});
  const [cities, setCities] = useState<City[]>([]);
  const [categories, setCategories] = useState<TalentCategory[]>([]);

  useEffect(() => {
    listAllActiveCities()
      .then(setCities)
      .catch(() => setCities([]));
    listAllActiveCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  function load() {
    setLoading(true);
    setError(null);
    listTalent({ ...filters, page, perPage: PER_PAGE, sortBy, sortOrder })
      .then((result) => {
        setRows(result.items);
        setTotal(result.total);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load talent."),
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, [filters, page, sortBy, sortOrder]);

  function updateFilter<K extends keyof TalentListFilters>(
    key: K,
    value: TalentListFilters[K],
  ) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  async function handleBulkAction(action: BulkAction, ids: string[]) {
    if (ids.length === 0) return;
    try {
      const result = await bulkTalent(ids, action);
      showToast(
        `${result.affected} of ${result.requested} talent profile(s) updated.`,
        "success",
      );
      load();
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Bulk action failed.",
        "error",
      );
    }
  }

  const columns: DataTableColumn<Talent>[] = [
    {
      key: "displayName",
      header: "Name",
      sortable: true,
      render: (row) => row.displayName,
    },
    { key: "city", header: "City", render: (row) => row.city.name },
    {
      key: "basePrice",
      header: "Starting price",
      sortable: true,
      render: (row) => formatPrice(row.pricing.basePrice, row.pricing.currency),
    },
    {
      key: "availability",
      header: "Availability",
      render: (row) => row.availability,
    },
    {
      key: "flags",
      header: "Flags",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.isPremium ? <Badge label="Premium" /> : null}
          {row.isFeatured ? <Badge label="Featured" /> : null}
          {!row.isActive ? <Badge label="Inactive" tone="muted" /> : null}
        </div>
      ),
    },
    {
      key: "verificationStatus",
      header: "Verification",
      render: (row) => row.verificationStatus,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-porcelain">
            Talent
          </h1>
          <p className="mt-1 text-[14px] text-porcelain/60">
            Manage the agency&apos;s talent catalog.
          </p>
        </div>
        <Link
          href="/talent/new"
          className="rounded-md bg-brass-deep px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-brass"
        >
          Add new talent
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-white/10 bg-ink-soft p-4">
        <input
          value={filters.q ?? ""}
          onChange={(event) => updateFilter("q", event.target.value)}
          placeholder="Search by name..."
          aria-label="Search talent"
          className="min-w-[200px] flex-1 rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
        />
        <select
          value={filters.cityId ?? ""}
          onChange={(event) => updateFilter("cityId", event.target.value)}
          className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
        >
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        <select
          value={filters.categorySlug ?? ""}
          onChange={(event) => updateFilter("categorySlug", event.target.value)}
          className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={filters.availability ?? ""}
          onChange={(event) =>
            updateFilter(
              "availability",
              event.target.value as TalentListFilters["availability"],
            )
          }
          className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
        >
          <option value="">Any availability</option>
          <option value="available">Available</option>
          <option value="limited">Limited</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <label className="flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-[13.5px] text-porcelain/80">
          <input
            type="checkbox"
            checked={filters.isFeatured ?? false}
            onChange={(event) =>
              updateFilter("isFeatured", event.target.checked || undefined)
            }
            className="h-4 w-4 accent-brass-deep"
          />
          Featured
        </label>
        <label className="flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-[13.5px] text-porcelain/80">
          <input
            type="checkbox"
            checked={filters.isPremium ?? false}
            onChange={(event) =>
              updateFilter("isPremium", event.target.checked || undefined)
            }
            className="h-4 w-4 accent-brass-deep"
          />
          Premium
        </label>
        <label className="flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-[13.5px] text-porcelain/80">
          <input
            type="checkbox"
            checked={filters.isActive ?? false}
            onChange={(event) =>
              updateFilter("isActive", event.target.checked || undefined)
            }
            className="h-4 w-4 accent-brass-deep"
          />
          Active only
        </label>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        onRetry={load}
        page={page}
        perPage={PER_PAGE}
        total={total}
        onPageChange={setPage}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => {
          setSortBy(by);
          setSortOrder(order);
        }}
        onBulkAction={handleBulkAction}
        rowHref={(row) => `/talent/${row.id}`}
        emptyTitle="No talent found"
        emptyDescription="Try adjusting your search or filters, or add a new talent profile."
      />
    </div>
  );
}

function Badge({
  label,
  tone = "brass",
}: {
  label: string;
  tone?: "brass" | "muted";
}) {
  return (
    <span
      className={[
        "rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "brass"
          ? "bg-brass-deep/20 text-brass"
          : "bg-white/10 text-porcelain/60",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

export default function TalentListPage() {
  return (
    <AdminShell>
      <TalentListContent />
    </AdminShell>
  );
}
