"use client";

import { useEffect, useState } from "react";

import { listMedia } from "../../lib/data/media";
import type { MediaAsset } from "../../lib/types";
import { Modal } from "../ui/Modal";
import { MediaThumbnail } from "./MediaThumbnail";
import { MediaUploadDropzone } from "./MediaUploadDropzone";

/** Reusable "add an image from the Media Library" picker — upload new or choose existing. */
export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
}) {
  const [tab, setTab] = useState<"upload" | "existing">("existing");
  const [search, setSearch] = useState("");
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || tab !== "existing") return;
    setLoading(true);
    const timeout = window.setTimeout(() => {
      listMedia({ search: search || undefined, perPage: 40 })
        .then((result) => setAssets(result.items))
        .catch(() => setAssets([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [isOpen, tab, search]);

  return (
    <Modal
      title="Add image"
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClassName="max-w-3xl"
    >
      <div className="flex gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setTab("existing")}
          aria-pressed={tab === "existing"}
          className={[
            "rounded-md px-3 py-1.5 text-[13px] font-medium",
            tab === "existing"
              ? "bg-brass-deep/20 text-brass"
              : "text-porcelain/60 hover:bg-white/5",
          ].join(" ")}
        >
          Choose existing
        </button>
        <button
          type="button"
          onClick={() => setTab("upload")}
          aria-pressed={tab === "upload"}
          className={[
            "rounded-md px-3 py-1.5 text-[13px] font-medium",
            tab === "upload"
              ? "bg-brass-deep/20 text-brass"
              : "text-porcelain/60 hover:bg-white/5",
          ].join(" ")}
        >
          Upload new
        </button>
      </div>

      <div className="pt-4">
        {tab === "upload" ? (
          <MediaUploadDropzone folderId={undefined} onUploaded={onSelect} />
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by filename or alt text…"
              aria-label="Search media"
              className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
            />
            {loading ? (
              <p className="py-8 text-center text-[13px] text-porcelain/50">
                Loading…
              </p>
            ) : assets.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-porcelain/50">
                No images found.
              </p>
            ) : (
              <ul className="grid max-h-96 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-5">
                {assets.map((asset) => (
                  <li key={asset.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(asset)}
                      className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-white/10 hover:border-brass focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass"
                    >
                      <MediaThumbnail
                        src={asset.optimizedUrl}
                        alt={asset.altText ?? ""}
                        className="h-full w-full"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
