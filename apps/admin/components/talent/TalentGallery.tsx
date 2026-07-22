"use client";

import { useEffect, useState } from "react";

import { MediaPickerModal } from "../media/MediaPickerModal";
import { MediaThumbnail } from "../media/MediaThumbnail";
import { ApiError } from "../../lib/api/client";
import {
  addTalentMedia,
  removeTalentMedia,
  reorderTalentMedia,
  setPrimaryTalentMedia,
} from "../../lib/data/talent";
import type { MediaAsset } from "../../lib/types";
import type { TalentMedia } from "../../lib/types";
import { useToast } from "../ui/Toast";

/**
 * M6: gallery entries reference the Media Library (upload new or choose an
 * existing MediaAsset) instead of the M4 raw URL form. Ordering, primary
 * image, and delete remain per-talent concerns handled here.
 */
export function TalentGallery({
  talentId,
  media,
  onChange,
}: {
  talentId: string;
  media: TalentMedia[];
  onChange: (media: TalentMedia[]) => void;
}) {
  const { showToast } = useToast();
  const [items, setItems] = useState<TalentMedia[]>(media);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => setItems(media), [media]);

  async function handlePicked(asset: MediaAsset) {
    setPickerOpen(false);
    try {
      const created = await addTalentMedia(talentId, {
        mediaAssetId: asset.id,
      });
      const next = created.isPrimary
        ? [...items.map((item) => ({ ...item, isPrimary: false })), created]
        : [...items, created];
      setItems(next);
      onChange(next);
      showToast("Image added to gallery.", "success");
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Failed to add image.",
        "error",
      );
    }
  }

  async function handleRemove(mediaId: string) {
    try {
      await removeTalentMedia(talentId, mediaId);
      const next = items.filter((item) => item.id !== mediaId);
      setItems(next);
      onChange(next);
      showToast("Image removed.", "success");
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Failed to remove image.",
        "error",
      );
    }
  }

  async function handleSetPrimary(mediaId: string) {
    try {
      await setPrimaryTalentMedia(talentId, mediaId);
      const next = items.map((item) => ({
        ...item,
        isPrimary: item.id === mediaId,
      }));
      setItems(next);
      onChange(next);
    } catch (error) {
      showToast(
        error instanceof ApiError
          ? error.message
          : "Failed to set primary image.",
        "error",
      );
    }
  }

  async function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(dragIndex, 1);
    if (moved) next.splice(targetIndex, 0, moved);
    setItems(next);
    setDragIndex(null);

    try {
      const saved = await reorderTalentMedia(
        talentId,
        next.map((item) => item.id),
      );
      setItems(saved);
      onChange(saved);
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Failed to save new order.",
        "error",
      );
      setItems(media);
    }
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="text-[13.5px] text-porcelain/50">
          No gallery images yet.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item, index) => (
            <li
              key={item.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(index)}
              className="relative cursor-grab rounded-lg border border-white/10 bg-ink p-2 active:cursor-grabbing"
            >
              <div className="aspect-square overflow-hidden rounded-md">
                <MediaThumbnail
                  src={item.optimizedUrl}
                  alt={item.alt}
                  className="h-full w-full"
                />
              </div>
              {item.isPrimary ? (
                <span className="absolute left-3 top-3 rounded-full bg-brass-deep px-2 py-0.5 text-[10px] font-semibold text-white">
                  Primary
                </span>
              ) : null}
              <div className="mt-2 flex items-center justify-between gap-1">
                {!item.isPrimary ? (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(item.id)}
                    className="text-[11px] text-porcelain/60 hover:text-brass"
                  >
                    Make primary
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="text-[11px] text-danger hover:text-danger/80"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="mt-4 rounded-md bg-brass-deep px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-brass"
      >
        Add image
      </button>

      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePicked}
      />
    </div>
  );
}
