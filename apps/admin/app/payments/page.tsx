"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "../../components/layout/AdminShell";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { listPayments } from "../../lib/data/payments";
import type {
  Payment,
  PaymentListFilters,
  PaymentStatus,
} from "../../lib/types";

const PER_PAGE = 20;

const STATUS_OPTIONS: PaymentStatus[] = [
  "created",
  "authorized",
  "captured",
  "failed",
  "refunded",
];

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function PaymentsContent() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PaymentListFilters>({});

  function load() {
    setLoading(true);
    setError(null);
    listPayments({ ...filters, page, perPage: PER_PAGE })
      .then((result) => {
        setRows(result.items);
        setTotal(result.total);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load payments.",
        ),
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, [filters, page]);

  const columns: DataTableColumn<Payment>[] = [
    {
      key: "user",
      header: "Customer",
      render: (row) => (
        <div>
          <p>{row.user.fullName}</p>
          <p className="text-porcelain/50">{row.user.email}</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => formatPrice(row.amount, row.currency),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => row.status,
    },
    {
      key: "razorpayOrderId",
      header: "Razorpay order",
      render: (row) => (
        <span className="font-mono text-[12.5px]">{row.razorpayOrderId}</span>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      render: (row) =>
        new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
          new Date(row.createdAt),
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-porcelain">
          Payments
        </h1>
        <p className="mt-1 text-[14px] text-porcelain/60">
          Read-only reconciliation view of Razorpay transactions.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-white/10 bg-ink-soft p-4">
        <select
          value={filters.status ?? ""}
          onChange={(event) => {
            setPage(1);
            setFilters((prev) => ({
              ...prev,
              status: (event.target.value || undefined) as
                PaymentStatus | undefined,
            }));
          }}
          className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
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
        selectable={false}
        emptyTitle="No payments found"
        emptyDescription="Payments appear here once a Member completes checkout."
      />
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <AdminShell>
      <PaymentsContent />
    </AdminShell>
  );
}
