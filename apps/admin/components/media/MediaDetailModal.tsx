"use client";

import { useRef, useState } from "react";

import { ApiError } from "../../lib/api/client";
import { deleteMedia, replaceMedia, updateMedia } from "../../lib/data/media";
import type { MediaAsset } from "../../lib/types";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";
import { MediaThumbnail } from "./MediaThumbnail";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function MediaDetailModal({
  asset,
  onClose,
  onUpdated,
  onDeleted,
}: {
  asset: MediaAsset | null;
  onClose: () => void;
  onUpdated: (asset: MediaAsset) => void;
  onDeleted: (id: string) => void;
}) {
  const { showToast } = useToast();
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState(asset?.altText ?? "");
  const [savingAlt, setSavingAlt] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!asset) return null;

  async function handleSaveAlt() {
    if (!asset) return;
    setSavingAlt(true);
    try {
      const updated = await updateMedia(asset.id, { altText });
      onUpdated(updated);
      showToast("Alt text saved.", "success");
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Failed to save alt text.",
        "error",
      );
    } finally {
      setSavingAlt(false);
    }
  }

  async function handleReplace(file: File) {
    if (!asset) return;
    setReplacing(true);
    try {
      const updated = await replaceMedia(asset.id, file);
      onUpdated(updated);
      showToast("Image replaced.", "success");
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Failed to replace image.",
        "error",
      );
    } finally {
      setReplacing(false);
    }
  }

  async function handleDelete() {
    if (!asset) return;
    if (!window.confirm("Move this image to Trash?")) return;
    setDeleting(true);
    try {
      await deleteMedia(asset.id);
      onDeleted(asset.id);
      showToast("Image moved to Trash.", "success");
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Failed to delete image.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  }

  function copyToClipboard(value: string, label: string) {
    navigator.clipboard
      .writeText(value)
      .then(() => showToast(`${label} copied.`, "success"))
      .catch(() => showToast("Could not copy to clipboard.", "error"));
  }

  return (
    <Modal
      title={asset.originalFilename ?? "Image details"}
      isOpen={Boolean(asset)}
      onClose={onClose}
      maxWidthClassName="max-w-2xl"
    >
      <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-ink">
          <MediaThumbnail
            src={asset.optimizedUrl}
            alt={asset.altText ?? ""}
            className="h-full w-full"
          />
        </div>

        <div className="flex flex-col gap-4">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12.5px]">
            <dt className="text-porcelain/50">Dimensions</dt>
            <dd className="text-porcelain/80">
              {asset.width && asset.height
                ? `${asset.width} × ${asset.height}px`
                : "Unknown"}
            </dd>
            <dt className="text-porcelain/50">File size</dt>
            <dd className="text-porcelain/80">{formatBytes(asset.bytes)}</dd>
            <dt className="text-porcelain/50">Format</dt>
            <dd className="text-porcelain/80">
              {asset.format?.toUpperCase() ?? "Unknown"}
            </dd>
            <dt className="text-porcelain/50">Uploaded</dt>
            <dd className="text-porcelain/80">
              {new Date(asset.createdAt).toLocaleDateString()}
            </dd>
            <dt className="text-porcelain/50">Used in</dt>
            <dd className="text-porcelain/80">
              {asset.usageCount} place{asset.usageCount === 1 ? "" : "s"}
            </dd>
          </dl>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="media-alt-text"
              className="text-[12px] text-porcelain/60"
            >
              Alt text
            </label>
            <div className="flex gap-2">
              <input
                id="media-alt-text"
                value={altText}
                onChange={(event) => setAltText(event.target.value)}
                className="flex-1 rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSaveAlt}
                disabled={savingAlt}
                className="rounded-md border border-white/15 px-3 py-2 text-[12.5px] text-porcelain/80 hover:bg-white/5 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copyToClipboard(asset.url, "Original URL")}
              className="rounded-md border border-white/15 px-3 py-2 text-[12.5px] text-porcelain/80 hover:bg-white/5"
            >
              Copy URL
            </button>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(asset.optimizedUrl, "Optimized URL")
              }
              className="rounded-md border border-white/15 px-3 py-2 text-[12.5px] text-porcelain/80 hover:bg-white/5"
            >
              Copy optimized URL
            </button>
          </div>

          <div className="mt-auto flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => replaceInputRef.current?.click()}
              disabled={replacing}
              className="rounded-md bg-brass-deep px-4 py-2 text-[13px] font-semibold text-white hover:bg-brass disabled:cursor-not-allowed disabled:opacity-45"
            >
              {replacing ? "Replacing…" : "Replace image"}
            </button>
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleReplace(file);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || asset.usageCount > 0}
              title={
                asset.usageCount > 0
                  ? "Remove this image from everywhere it's used first."
                  : undefined
              }
              className="rounded-md border border-danger/40 px-4 py-2 text-[13px] font-semibold text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Move to Trash
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
