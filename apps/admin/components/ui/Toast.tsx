"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const AUTO_DISMISS_MS = 4000;

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "border-success/40 text-porcelain",
  error: "border-danger/50 text-porcelain",
  info: "border-brass/40 text-porcelain",
};

const VARIANT_DOT: Record<ToastVariant, string> = {
  success: "bg-success",
  error: "bg-danger",
  info: "bg-brass",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, variant }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={[
              "pointer-events-auto flex items-start gap-3 rounded-lg border bg-ink-soft px-4 py-3 shadow-lg",
              VARIANT_CLASSES[toast.variant],
            ].join(" ")}
          >
            <span
              className={[
                "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                VARIANT_DOT[toast.variant],
              ].join(" ")}
              aria-hidden="true"
            />
            <p className="flex-1 text-[13.5px] leading-relaxed">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="text-porcelain/50 hover:text-porcelain"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-4 w-4"
              >
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
