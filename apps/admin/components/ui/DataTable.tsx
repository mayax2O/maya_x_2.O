"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import type { BulkAction } from "../../lib/types/common";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { SkeletonTableRows } from "./Skeleton";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render: (row: T) => ReactNode;
  className?: string;
}

export interface BulkActionConfig {
  action: BulkAction;
  label: string;
  variant?: "default" | "danger";
}

const DEFAULT_BULK_ACTIONS: BulkActionConfig[] = [
  { action: "activate", label: "Activate" },
  { action: "deactivate", label: "Deactivate" },
  { action: "delete", label: "Delete", variant: "danger" },
];

export interface DataTableProps<T extends { id: string }> {
  columns: DataTableColumn<T>[];
  rows: T[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  page: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  selectable?: boolean;
  bulkActions?: BulkActionConfig[];
  onBulkAction?: (action: BulkAction, ids: string[]) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  rowHref?: (row: T) => string;
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  error,
  onRetry,
  page,
  perPage,
  total,
  onPageChange,
  sortBy,
  sortOrder = "asc",
  onSortChange,
  selectable = true,
  bulkActions = DEFAULT_BULK_ACTIONS,
  onBulkAction,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  rowHref,
}: DataTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;

  function toggleAll() {
    setSelectedIds(allSelected ? [] : rows.map((row) => row.id));
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  }

  function handleSort(column: DataTableColumn<T>) {
    if (!column.sortable || !onSortChange) return;
    const nextOrder: "asc" | "desc" =
      sortBy === column.key && sortOrder === "asc" ? "desc" : "asc";
    onSortChange(column.key, nextOrder);
  }

  function handleBulkAction(action: BulkAction) {
    onBulkAction?.(action, selectedIds);
    setSelectedIds([]);
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!loading && rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-ink-soft">
      {selectable && selectedIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-brass-deep/10 px-4 py-2.5">
          <p className="text-[13.5px] text-porcelain">
            {selectedIds.length} selected
          </p>
          <div className="flex flex-wrap gap-2">
            {bulkActions.map((config) => (
              <button
                key={config.action}
                type="button"
                onClick={() => handleBulkAction(config.action)}
                className={[
                  "rounded-md px-3 py-1.5 text-[13px] font-medium transition",
                  config.variant === "danger"
                    ? "bg-danger/20 text-danger hover:bg-danger/30"
                    : "bg-white/10 text-porcelain hover:bg-white/20",
                ].join(" ")}
              >
                {config.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13.5px]">
          <thead className="border-b border-white/10 text-[12px] uppercase tracking-wide text-porcelain/50">
            <tr>
              {selectable ? (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 accent-brass-deep"
                  />
                </th>
              ) : null}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={["px-4 py-3 font-medium", column.className]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column)}
                      className="inline-flex items-center gap-1 hover:text-porcelain"
                    >
                      {column.header}
                      {sortBy === column.key ? (
                        <span aria-hidden="true">
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      ) : null}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <SkeletonTableRows
                columns={columns.length + (selectable ? 1 : 0)}
              />
            ) : (
              rows.map((row) => {
                const href = rowHref?.(row);
                return (
                  <tr
                    key={row.id}
                    className="text-porcelain/85 hover:bg-white/[0.03]"
                  >
                    {selectable ? (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(row.id)}
                          onChange={() => toggleRow(row.id)}
                          aria-label="Select row"
                          className="h-4 w-4 accent-brass-deep"
                        />
                      </td>
                    ) : null}
                    {columns.map((column, index) => (
                      <td
                        key={column.key}
                        className={["px-4 py-3", column.className]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {href && index === 0 ? (
                          <a
                            href={href}
                            className="font-medium text-porcelain hover:text-brass"
                          >
                            {column.render(row)}
                          </a>
                        ) : (
                          column.render(row)
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-[13px] text-porcelain/60">
        <p>
          {total === 0
            ? "0 results"
            : `Page ${page} of ${totalPages} — ${total} total`}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="rounded-md border border-white/15 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="rounded-md border border-white/15 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
