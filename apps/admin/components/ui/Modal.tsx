"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function Modal({
  title,
  isOpen,
  onClose,
  children,
  maxWidthClassName = "max-w-lg",
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={[
          "max-h-[90vh] w-full overflow-y-auto rounded-lg border border-white/10 bg-ink-soft p-6 shadow-2xl",
          maxWidthClassName,
        ].join(" ")}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2
            id="modal-title"
            className="font-display text-lg font-semibold text-porcelain"
          >
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-porcelain/50 hover:text-porcelain focus-visible:outline focus-visible:outline-2 focus-visible:outline-brass"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
