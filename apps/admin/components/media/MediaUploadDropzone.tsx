"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";

import { ApiError } from "../../lib/api/client";
import { uploadMedia } from "../../lib/data/media";
import type { MediaAsset } from "../../lib/types";
import { useToast } from "../ui/Toast";

interface UploadItem {
  id: string;
  fileName: string;
  status: "uploading" | "done" | "error";
  errorMessage?: string;
}

export function MediaUploadDropzone({
  folderId,
  onUploaded,
}: {
  folderId: string | undefined;
  onUploaded: (asset: MediaAsset) => void;
}) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    for (const file of list) {
      const uploadId = crypto.randomUUID();
      setUploads((prev) => [
        ...prev,
        { id: uploadId, fileName: file.name, status: "uploading" },
      ]);
      try {
        const asset = await uploadMedia(file, { folderId });
        setUploads((prev) =>
          prev.map((item) =>
            item.id === uploadId ? { ...item, status: "done" } : item,
          ),
        );
        onUploaded(asset);
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "Upload failed.";
        setUploads((prev) =>
          prev.map((item) =>
            item.id === uploadId
              ? { ...item, status: "error", errorMessage: message }
              : item,
          ),
        );
        showToast(`${file.name}: ${message}`, "error");
      }
    }
    window.setTimeout(() => {
      setUploads((prev) => prev.filter((item) => item.status === "uploading"));
    }, 3000);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingOver(false);
    if (event.dataTransfer.files.length > 0) {
      uploadFiles(event.dataTransfer.files);
    }
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        aria-label="Upload images: click or drag and drop"
        className={[
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass",
          isDraggingOver
            ? "border-brass bg-brass-deep/10"
            : "border-white/15 hover:border-white/25",
        ].join(" ")}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="h-8 w-8 text-porcelain/40"
        >
          <path d="M12 16V4m0 0 4 4m-4-4-4 4" strokeLinecap="round" />
          <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
        <p className="text-[13.5px] text-porcelain/70">
          Drag &amp; drop images here, or click to browse
        </p>
        <p className="text-[12px] text-porcelain/40">JPG, PNG, WEBP, or AVIF</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files && event.target.files.length > 0) {
              uploadFiles(event.target.files);
            }
            event.target.value = "";
          }}
        />
      </div>

      {uploads.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-1.5">
          {uploads.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-ink px-3 py-2 text-[12.5px]"
            >
              <span className="truncate text-porcelain/70">
                {item.fileName}
              </span>
              {item.status === "uploading" ? (
                <span className="shrink-0 text-porcelain/50">Uploading…</span>
              ) : item.status === "done" ? (
                <span className="shrink-0 text-success">Done</span>
              ) : (
                <span className="shrink-0 text-danger">
                  {item.errorMessage ?? "Failed"}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
