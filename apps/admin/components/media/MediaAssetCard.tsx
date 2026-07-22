"use client";

import type { MediaAsset } from "../../lib/types";
import { MediaThumbnail } from "./MediaThumbnail";

export function MediaAssetCard({
  asset,
  selected,
  onToggleSelect,
  onOpen,
}: {
  asset: MediaAsset;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
}) {
  return (
    <li
      className={[
        "group relative overflow-hidden rounded-lg border bg-ink transition-colors",
        selected ? "border-brass" : "border-white/10 hover:border-white/25",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open details for ${asset.originalFilename ?? "image"}`}
        className="flex aspect-square w-full items-center justify-center overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass"
      >
        <MediaThumbnail
          src={asset.optimizedUrl}
          alt={asset.altText ?? ""}
          className="h-full w-full"
        />
      </button>

      <label className="absolute left-2 top-2 flex h-5 w-5 items-center justify-center rounded border border-white/30 bg-ink/80 backdrop-blur">
        <span className="sr-only">
          Select {asset.originalFilename ?? "image"}
        </span>
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="h-3.5 w-3.5 accent-brass-deep"
        />
      </label>

      {asset.usageCount > 0 ? (
        <span className="absolute right-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-porcelain/80 backdrop-blur">
          Used ×{asset.usageCount}
        </span>
      ) : null}

      <p className="truncate border-t border-white/10 px-2 py-1.5 text-[11px] text-porcelain/60">
        {asset.originalFilename ?? "Untitled"}
      </p>
    </li>
  );
}
