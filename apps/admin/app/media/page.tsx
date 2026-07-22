"use client";

import { useCallback, useEffect, useState } from "react";

import { AdminShell } from "../../components/layout/AdminShell";
import { MediaAssetCard } from "../../components/media/MediaAssetCard";
import { MediaDetailModal } from "../../components/media/MediaDetailModal";
import { MediaFolderSidebar } from "../../components/media/MediaFolderSidebar";
import { MediaUploadDropzone } from "../../components/media/MediaUploadDropzone";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../lib/api/client";
import {
  bulkDeleteMedia,
  bulkMoveMedia,
  listMedia,
  listMediaFolders,
} from "../../lib/data/media";
import type { MediaAsset, MediaFolder } from "../../lib/types";

const PER_PAGE = 24;

function MediaLibraryContent() {
  const { showToast } = useToast();

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "name">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | undefined>(
    undefined,
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openAssetId, setOpenAssetId] = useState<string | null>(null);
  const [moveTargetFolderId, setMoveTargetFolderId] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch, activeFolderId, sort]);

  const loadFolders = useCallback(() => {
    listMediaFolders()
      .then(setFolders)
      .catch(() => {
        // Folder list failing shouldn't block the asset grid — the folder
        // filter sidebar just stays empty.
      });
  }, []);

  const loadAssets = useCallback(() => {
    setLoading(true);
    setError(null);
    listMedia({
      search: debouncedSearch || undefined,
      folderId: activeFolderId,
      sort,
      page,
      perPage: PER_PAGE,
    })
      .then((result) => {
        setAssets(result.items);
        setTotal(result.total);
      })
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : "Failed to load media.",
        ),
      )
      .finally(() => setLoading(false));
  }, [debouncedSearch, activeFolderId, sort, page]);

  useEffect(loadFolders, [loadFolders]);
  useEffect(loadAssets, [loadAssets]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (
      !window.confirm(
        `Delete ${selectedIds.size} image(s)? Images still in use elsewhere will be skipped.`,
      )
    ) {
      return;
    }
    try {
      const result = await bulkDeleteMedia(Array.from(selectedIds));
      showToast(
        `Deleted ${result.affected} of ${result.requested} selected image(s).`,
        result.affected === result.requested ? "success" : "info",
      );
      clearSelection();
      loadAssets();
      loadFolders();
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Bulk delete failed.",
        "error",
      );
    }
  }

  async function handleBulkMove() {
    if (selectedIds.size === 0) return;
    try {
      const result = await bulkMoveMedia(
        Array.from(selectedIds),
        moveTargetFolderId || null,
      );
      showToast(`Moved ${result.affected} image(s).`, "success");
      clearSelection();
      setMoveTargetFolderId("");
      loadAssets();
      loadFolders();
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Bulk move failed.",
        "error",
      );
    }
  }

  const openAsset = assets.find((asset) => asset.id === openAssetId) ?? null;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-porcelain">
            Media Library
          </h1>
          <p className="mt-1 text-[14px] text-porcelain/60">
            Upload, organize, and reuse images across the site.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="flex flex-col gap-6">
          <MediaFolderSidebar
            folders={folders}
            activeFolderId={activeFolderId}
            onSelect={setActiveFolderId}
            onFoldersChange={() => {
              loadFolders();
              loadAssets();
            }}
          />
        </div>

        <div className="flex flex-col gap-5">
          <MediaUploadDropzone
            folderId={activeFolderId}
            onUploaded={() => {
              loadAssets();
              loadFolders();
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by filename or alt text…"
                aria-label="Search media"
                className="w-64 rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
              />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as typeof sort)}
                aria-label="Sort media"
                className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name">Name (A–Z)</option>
              </select>
            </div>

            <div
              role="group"
              aria-label="View mode"
              className="flex overflow-hidden rounded-md border border-white/15"
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                className={[
                  "px-3 py-2 text-[12.5px]",
                  viewMode === "grid"
                    ? "bg-brass-deep/20 text-brass"
                    : "text-porcelain/60 hover:bg-white/5",
                ].join(" ")}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className={[
                  "px-3 py-2 text-[12.5px]",
                  viewMode === "list"
                    ? "bg-brass-deep/20 text-brass"
                    : "text-porcelain/60 hover:bg-white/5",
                ].join(" ")}
              >
                List
              </button>
            </div>
          </div>

          {selectedIds.size > 0 ? (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-brass/30 bg-brass-deep/10 px-4 py-2.5">
              <span className="text-[13px] text-porcelain/80">
                {selectedIds.size} selected
              </span>
              <select
                value={moveTargetFolderId}
                onChange={(event) => setMoveTargetFolderId(event.target.value)}
                aria-label="Move selected to folder"
                className="rounded-md border border-white/15 bg-ink px-2 py-1.5 text-[12.5px] text-porcelain focus:border-brass focus:outline-none"
              >
                <option value="">No folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleBulkMove}
                className="rounded-md border border-white/15 px-3 py-1.5 text-[12.5px] text-porcelain/80 hover:bg-white/5"
              >
                Move
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="rounded-md border border-danger/40 px-3 py-1.5 text-[12.5px] font-semibold text-danger hover:bg-danger/10"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="ml-auto text-[12.5px] text-porcelain/50 hover:text-porcelain"
              >
                Clear selection
              </button>
            </div>
          ) : null}

          {loading ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <li key={index}>
                  <Skeleton className="aspect-square w-full rounded-lg" />
                </li>
              ))}
            </ul>
          ) : error ? (
            <ErrorState message={error} onRetry={loadAssets} />
          ) : assets.length === 0 ? (
            <EmptyState
              title="No images yet"
              description="Upload your first image using the box above, or adjust your search and folder filters."
            />
          ) : viewMode === "grid" ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {assets.map((asset) => (
                <MediaAssetCard
                  key={asset.id}
                  asset={asset}
                  selected={selectedIds.has(asset.id)}
                  onToggleSelect={() => toggleSelect(asset.id)}
                  onOpen={() => setOpenAssetId(asset.id)}
                />
              ))}
            </ul>
          ) : (
            <table className="w-full border-collapse text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-white/10 text-porcelain/50">
                  <th className="w-8 px-2 py-2" />
                  <th className="px-2 py-2 font-medium">File</th>
                  <th className="px-2 py-2 font-medium">Size</th>
                  <th className="px-2 py-2 font-medium">Dimensions</th>
                  <th className="px-2 py-2 font-medium">Used</th>
                  <th className="px-2 py-2 font-medium">Uploaded</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="cursor-pointer border-b border-white/5 text-porcelain/80 hover:bg-white/5"
                    onClick={() => setOpenAssetId(asset.id)}
                  >
                    <td
                      className="px-2 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(asset.id)}
                        onChange={() => toggleSelect(asset.id)}
                        aria-label={`Select ${asset.originalFilename ?? "image"}`}
                        className="h-3.5 w-3.5 accent-brass-deep"
                      />
                    </td>
                    <td className="px-2 py-2">
                      {asset.originalFilename ?? "Untitled"}
                    </td>
                    <td className="px-2 py-2 text-porcelain/50">
                      {asset.bytes
                        ? `${(asset.bytes / 1024).toFixed(0)} KB`
                        : "—"}
                    </td>
                    <td className="px-2 py-2 text-porcelain/50">
                      {asset.width && asset.height
                        ? `${asset.width}×${asset.height}`
                        : "—"}
                    </td>
                    <td className="px-2 py-2 text-porcelain/50">
                      {asset.usageCount}
                    </td>
                    <td className="px-2 py-2 text-porcelain/50">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && !error && total > PER_PAGE ? (
            <div className="flex items-center justify-between text-[13px] text-porcelain/60">
              <span>
                Page {page} of {totalPages} — {total} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-white/15 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-md border border-white/15 px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <MediaDetailModal
        asset={openAsset}
        onClose={() => setOpenAssetId(null)}
        onUpdated={(updated) => {
          setAssets((prev) =>
            prev.map((item) => (item.id === updated.id ? updated : item)),
          );
        }}
        onDeleted={(id) => {
          setAssets((prev) => prev.filter((item) => item.id !== id));
          setOpenAssetId(null);
          loadFolders();
        }}
      />
    </div>
  );
}

export default function MediaLibraryPage() {
  return (
    <AdminShell>
      <MediaLibraryContent />
    </AdminShell>
  );
}
