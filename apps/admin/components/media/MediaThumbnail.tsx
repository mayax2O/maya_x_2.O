"use client";

import { useState } from "react";

/**
 * Falls back to a gradient placeholder (same visual language as the old
 * URL-only TalentGallery placeholder) if the asset's URL 404s — legacy,
 * pre-Cloudinary assets carry `/mock/...` relative paths that don't
 * resolve from the admin app's origin.
 */
export function MediaThumbnail({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={[
          "flex items-center justify-center bg-gradient-to-br from-ink-soft to-ink px-2 text-center text-[11px] text-porcelain/40",
          className,
        ].join(" ")}
      >
        {alt || "No preview"}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URLs are already fully optimized/CDN-served; next/image would add no value here.
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={["object-cover", className].join(" ")}
    />
  );
}
