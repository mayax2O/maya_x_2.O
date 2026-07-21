"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "../../components/layout/AdminShell";
import { LocationFormModal } from "../../components/lookups/LocationFormModal";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../lib/api/client";
import { listAllActiveCities } from "../../lib/data/lookups";
import { bulkLocations, listLocations } from "../../lib/data/locations";
import type { BulkAction, City, Location } from "../../lib/types";

const PER_PAGE = 20;

function LocationsContent() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<Location[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [cityId, setCityId] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [modalLocation, setModalLocation] = useState<Location | "new" | null>(
    null,
  );

  useEffect(() => {
    listAllActiveCities()
      .then(setCities)
      .catch(() => setCities([]));
  }, []);

  function load() {
    setLoading(true);
    setError(null);
    listLocations({
      page,
      perPage: PER_PAGE,
      q: q || undefined,
      cityId: cityId || undefined,
      sortBy,
      sortOrder,
    })
      .then((result) => {
        setRows(result.items);
        setTotal(result.total);
      })
      .catch((err) =>
        setError(
          err instanceof Error ? err.message : "Failed to load locations.",
        ),
      )
      .finally(() => setLoading(false));
  }

  useEffect(load, [page, q, cityId, sortBy, sortOrder]);

  async function handleBulkAction(action: BulkAction, ids: string[]) {
    if (ids.length === 0) return;
    try {
      const result = await bulkLocations(ids, action);
      showToast(
        `${result.affected} of ${result.requested} locations updated.`,
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

  const columns: DataTableColumn<Location>[] = [
    { key: "name", header: "Name", sortable: true, render: (row) => row.name },
    {
      key: "city",
      header: "City",
      render: (row) => `${row.city.name}, ${row.city.state}`,
    },
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
          onClick={() => setModalLocation(row)}
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
            Locations
          </h1>
          <p className="mt-1 text-[14px] text-porcelain/60">
            Manage neighborhoods/venue areas within each city.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalLocation("new")}
          className="rounded-md bg-brass-deep px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-brass"
        >
          Add location
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
          aria-label="Search locations"
          className="max-w-sm flex-1 rounded-md border border-white/15 bg-ink-soft px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
        />
        <select
          value={cityId}
          onChange={(event) => {
            setPage(1);
            setCityId(event.target.value);
          }}
          className="rounded-md border border-white/15 bg-ink-soft px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
        >
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
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
        emptyTitle="No locations yet"
        emptyDescription="Add a location to start assigning talent to it."
      />

      <LocationFormModal
        isOpen={modalLocation !== null}
        location={
          modalLocation && modalLocation !== "new" ? modalLocation : undefined
        }
        onClose={() => setModalLocation(null)}
        onSaved={load}
      />
    </div>
  );
}

export default function LocationsPage() {
  return (
    <AdminShell>
      <LocationsContent />
    </AdminShell>
  );
}
