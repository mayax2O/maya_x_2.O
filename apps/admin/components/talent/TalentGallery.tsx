"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "../../lib/api/client";
import {
  addTalentMedia,
  removeTalentMedia,
  reorderTalentMedia,
  setPrimaryTalentMedia,
} from "../../lib/data/talent";
import type { TalentMedia } from "../../lib/types";
import { useToast } from "../ui/Toast";

/**
 * Gallery entries are added by URL, not real file upload — Cloudinary
 * integration is the dedicated Media Library milestone's job (see the
 * TalentMedia model comment in apps/api/prisma/schema.prisma). Everything
 * else here (ordering, primary image, delete) is fully real and persisted.
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
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => setItems(media), [media]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!url.trim() || !alt.trim()) return;
    setBusy(true);
    try {
      const created = await addTalentMedia(talentId, {
        url: url.trim(),
        alt: alt.trim(),
      });
      const next = created.isPrimary
        ? [...items.map((item) => ({ ...item, isPrimary: false })), created]
        : [...items, created];
      setItems(next);
      onChange(next);
      setUrl("");
      setAlt("");
      showToast("Image added.", "success");
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Failed to add image.",
        "error",
      );
    } finally {
      setBusy(false);
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
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-ink-soft to-ink px-2 text-center text-[11px] text-porcelain/40">
                {item.alt}
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

      <form
        onSubmit={handleAdd}
        className="mt-4 flex flex-wrap items-end gap-2"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="media-url" className="text-[12px] text-porcelain/60">
            Image URL
          </label>
          <input
            id="media-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="media-alt" className="text-[12px] text-porcelain/60">
            Alt text
          </label>
          <input
            id="media-alt"
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-brass-deep px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-brass disabled:cursor-not-allowed disabled:opacity-45"
        >
          Add image
        </button>
      </form>
    </div>
  );
}
