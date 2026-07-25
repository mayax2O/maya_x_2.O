"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "../../components/layout/AdminShell";
import { SubCategoryFormModal } from "../../components/lookups/SubCategoryFormModal";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../lib/api/client";
import { listAllActiveCategories } from "../../lib/data/lookups";
import {
  bulkSubCategories,
  listSubCategories,
} from "../../lib/data/subcategories";
import type {
  BulkAction,
  TalentCategory,
  TalentSubCategory,
} from "../../lib/types";

const PER_PAGE = 20;

function SubCategoriesContent() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<TalentSubCategory[]>([]);
  const [categories, setCategories] = useState<TalentCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [modalSubCategory, setModalSubCategory] = useState<
    TalentSubCategory | "new" | null
  >(null);

  function load() {
    setLoading(true);
    setError(null);
    listSubCategories({
      page,
      perPage: PER_PAGE,
      q: q || undefined,
      categoryId: categoryId || undefined,
      sortBy,
      sortOrder,
    })
      .then((result) => {
        setRows(result.items);
        setTotal(result.total);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load sub-categories.",
        ),
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, [page, q, categoryId, sortBy, sortOrder]);

  useEffect(() => {
    listAllActiveCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  async function handleBulkAction(action: BulkAction, ids: string[]) {
    if (ids.length === 0) return;
    try {
      const result = await bulkSubCategories(ids, action);
      showToast(
        `${result.affected} of ${result.requested} sub-categories updated.`,
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

  const columns: DataTableColumn<TalentSubCategory>[] = [
    { key: "name", header: "Name", sortable: true, render: (row) => row.name },
    {
      key: "category",
      header: "Category",
      render: (row) => categoryNameById.get(row.categoryId) ?? "—",
    },
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
          onClick={() => setModalSubCategory(row)}
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
            Sub-categories
          </h1>
          <p className="mt-1 text-[14px] text-porcelain/60">
            Manage sub-categories nested under a Category (Event Host → Wedding
            Host, Corporate Host, ...).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalSubCategory("new")}
          className="rounded-md bg-brass-deep px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-brass"
        >
          Add sub-category
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          value={q}
          onChange={(event) => {
            setPage(1);
            setQ(event.target.value);
          }}
          placeholder="Search by name..."
          aria-label="Search sub-categories"
          className="max-w-sm rounded-md border border-white/15 bg-ink-soft px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
        />
        <select
          value={categoryId}
          onChange={(event) => {
            setPage(1);
            setCategoryId(event.target.value);
          }}
          aria-label="Filter by category"
          className="rounded-md border border-white/15 bg-ink-soft px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
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
        emptyTitle="No sub-categories yet"
        emptyDescription="Add a sub-category to tag talent with finer-grained detail."
      />

      <SubCategoryFormModal
        isOpen={modalSubCategory !== null}
        subCategory={
          modalSubCategory && modalSubCategory !== "new"
            ? modalSubCategory
            : undefined
        }
        onClose={() => setModalSubCategory(null)}
        onSaved={load}
      />
    </div>
  );
}

export default function SubCategoriesPage() {
  return (
    <AdminShell>
      <SubCategoriesContent />
    </AdminShell>
  );
}
