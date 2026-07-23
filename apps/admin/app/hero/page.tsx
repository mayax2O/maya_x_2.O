"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "../../components/layout/AdminShell";
import { MediaPickerModal } from "../../components/media/MediaPickerModal";
import { MediaThumbnail } from "../../components/media/MediaThumbnail";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../lib/api/client";
import { getHeroSettings, updateHeroSettings } from "../../lib/data/hero";
import type { HeroMode, MediaAsset } from "../../lib/types";

interface SelectedItem {
  id: string;
  url: string;
  altText: string | null;
}

const MODE_OPTIONS: { value: HeroMode; label: string; description: string }[] =
  [
    {
      value: "image",
      label: "Single image",
      description: "One still background image.",
    },
    {
      value: "video",
      label: "Video",
      description: "One video, plays automatically, muted and looped.",
    },
    {
      value: "slider",
      label: "Slider",
      description: "An ordered set of images, auto-rotating.",
    },
  ];

function HeroSettingsContent() {
  const { showToast } = useToast();
  const [mode, setMode] = useState<HeroMode>("image");
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStatus("loading");
    try {
      const settings = await getHeroSettings();
      setMode(settings.mode);
      setItems(
        settings.media.map((item) => ({
          id: item.id,
          url: item.url,
          altText: item.altText,
        })),
      );
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function handlePicked(asset: MediaAsset) {
    setPickerOpen(false);
    const picked: SelectedItem = {
      id: asset.id,
      url: asset.optimizedUrl,
      altText: asset.altText,
    };
    setItems((current) => {
      if (mode === "slider") {
        if (current.some((item) => item.id === picked.id)) return current;
        return [...current, picked];
      }
      return [picked];
    });
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateHeroSettings({ mode, mediaIds: items.map((i) => i.id) });
      showToast("Hero settings saved.", "success");
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Something went wrong.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (status === "error") {
    return <ErrorState message="Couldn't load Hero settings." onRetry={load} />;
  }

  const canAddMore = mode === "slider" || items.length === 0;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      {/* Section: Mode selector */}
      <div>
        <h2 className="text-[13px] font-semibold uppercase tracking-widest text-porcelain/50">
          Background type
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              aria-pressed={mode === option.value}
              className={[
                "rounded-lg border p-4 text-left transition-colors",
                mode === option.value
                  ? "border-brass-deep bg-brass-deep/10"
                  : "border-white/10 hover:border-white/20",
              ].join(" ")}
            >
              <p className="text-[14px] font-semibold text-porcelain">
                {option.label}
              </p>
              <p className="mt-1 text-[12.5px] text-porcelain/60">
                {option.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Section: Selected media */}
      <div>
        <h2 className="text-[13px] font-semibold uppercase tracking-widest text-porcelain/50">
          {mode === "slider" ? "Slides" : "Media"}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-video overflow-hidden rounded-md border border-white/10"
            >
              <MediaThumbnail
                src={item.url}
                alt={item.altText ?? ""}
                className="h-full w-full"
              />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label="Remove"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink/80 text-porcelain opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
          {canAddMore ? (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex aspect-video items-center justify-center rounded-md border border-dashed border-white/20 text-[13px] text-porcelain/60 hover:border-brass hover:text-brass"
            >
              + Add {mode === "video" ? "video" : "image"}
            </button>
          ) : null}
        </div>
        {items.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-porcelain/50">
            No media selected — the Hero falls back to its default dark gradient
            background.
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="inline-flex w-fit items-center justify-center rounded-md bg-brass-deep px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-brass disabled:cursor-not-allowed disabled:opacity-45"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>

      <MediaPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handlePicked}
      />
    </div>
  );
}

export default function HeroSettingsPage() {
  return (
    <AdminShell>
      <h1 className="font-display text-2xl font-semibold text-porcelain">
        Hero
      </h1>
      <p className="mt-1 text-[14px] text-porcelain/60">
        Control the public site&apos;s home page background.
      </p>
      <div className="mt-6">
        <HeroSettingsContent />
      </div>
    </AdminShell>
  );
}
