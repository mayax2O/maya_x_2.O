"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "../../components/layout/AdminShell";
import { CategoryFormModal } from "../../components/lookups/CategoryFormModal";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../lib/api/client";
import { bulkCategories, listCategories } from "../../lib/data/categories";
import type { BulkAction, TalentCategory } from "../../lib/types";

const PER_PAGE = 20;

function CategoriesContent() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<TalentCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [modalCategory, setModalCategory] = useState<
    TalentCategory | "new" | null
  >(null);

  function load() {
    setLoading(true);
    setError(null);
    listCategories({
      page,
      perPage: PER_PAGE,
      q: q || undefined,
      sortBy,
      sortOrder,
    })
      .then((result) => {
        setRows(result.items);
        setTotal(result.total);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load categories.",
        ),
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, [page, q, sortBy, sortOrder]);

  async function handleBulkAction(action: BulkAction, ids: string[]) {
    if (ids.length === 0) return;
    try {
      const result = await bulkCategories(ids, action);
      showToast(
        `${result.affected} of ${result.requested} categories updated.`,
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

  const columns: DataTableColumn<TalentCategory>[] = [
    { key: "name", header: "Name", sortable: true, render: (row) => row.name },
    { key: "slug", header: "Slug", render: (row) => row.slug },
    {
      key: "displayOrder",
      header: "Order",
      sortable: true,
      render: (row) => row.displayOrder,
    },
    {
      key: "isActive",
      header: "Status",
      render: (row) => (
        <span className={row.isActive ? "text-success" : "text-porcelain/40"}>
          {row.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          type="button"
          onClick={() => setModalCategory(row)}
          className="text-[12.5px] font-medium text-brass hover:text-brass-deep"
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-porcelain">
            Categories
          </h1>
          <p className="mt-1 text-[14px] text-porcelain/60">
            Manage the talent categories used across the catalog (Event Host,
            Brand Ambassador, ...).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalCategory("new")}
          className="rounded-md bg-brass-deep px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-brass"
        >
          Add category
        </button>
      </div>

      <input
        value={q}
        onChange={(event) => {
          setPage(1);
          setQ(event.target.value);
        }}
        placeholder="Search by name..."
        aria-label="Search categories"
        className="max-w-sm rounded-md border border-white/15 bg-ink-soft px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
      />

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
        emptyTitle="No categories yet"
        emptyDescription="Add a category to start tagging talent with it."
      />

      <CategoryFormModal
        isOpen={modalCategory !== null}
        category={
          modalCategory && modalCategory !== "new" ? modalCategory : undefined
        }
        onClose={() => setModalCategory(null)}
        onSaved={load}
      />
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <AdminShell>
      <CategoriesContent />
    </AdminShell>
  );
}
