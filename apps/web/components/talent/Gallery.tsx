"use client";

import { Button } from "@maya-x/ui";
import { useState } from "react";

import type { TalentMedia } from "../../lib/types";
import { MediaFrame } from "../media/MediaFrame";

export function Gallery({ items }: { items: TalentMedia[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex !== null ? items[activeIndex] : undefined;

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="list">
        {items.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              className="block w-full rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-deep"
              onClick={() => setActiveIndex(index)}
              aria-label={`View larger image: ${item.alt}`}
            >
              <MediaFrame src={item.url} alt={item.alt} aspect="square" />
            </button>
          </li>
        ))}
      </ul>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-6"
          onClick={() => setActiveIndex(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setActiveIndex(null);
          }}
        >
          <div
            className="w-full max-w-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <MediaFrame
              src={active.url}
              alt={active.alt}
              aspect="square"
              className="w-full"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActiveIndex(null)}
              className="mt-4 border-none bg-white hover:bg-porcelain-soft"
              autoFocus
            >
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
