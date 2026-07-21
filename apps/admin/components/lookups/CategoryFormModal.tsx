"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "../../lib/api/client";
import { createCategory, updateCategory } from "../../lib/data/categories";
import type { TalentCategory } from "../../lib/types";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";

export function CategoryFormModal({
  category,
  isOpen,
  onClose,
  onSaved,
}: {
  category?: TalentCategory;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (category: TalentCategory) => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [displayOrder, setDisplayOrder] = useState(category?.displayOrder ?? 0);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setStatus("submitting");
    try {
      const saved = category
        ? await updateCategory(category.id, {
            name,
            slug: slug || undefined,
            displayOrder,
          })
        : await createCategory({ name, slug: slug || undefined, displayOrder });
      showToast(
        category ? "Category updated." : "Category created.",
        "success",
      );
      onSaved(saved);
      onClose();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : "Something went wrong.",
      );
    } finally {
      setStatus("idle");
    }
  }

  return (
    <Modal
      title={category ? "Edit category" : "Add category"}
      isOpen={isOpen}
      onClose={onClose}
      maxWidthClassName="max-w-sm"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {formError ? (
          <p
            role="alert"
            className="rounded-md bg-danger/10 px-3 py-2 text-[13px] text-danger"
          >
            {formError}
          </p>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="category-name"
            className="text-[13px] font-medium text-porcelain/70"
          >
            Category name
          </label>
          <input
            id="category-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="category-slug"
            className="text-[13px] font-medium text-porcelain/70"
          >
            Slug (auto-generated if left blank)
          </label>
          <input
            id="category-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="category-order"
            className="text-[13px] font-medium text-porcelain/70"
          >
            Display order
          </label>
          <input
            id="category-order"
            type="number"
            value={displayOrder}
            onChange={(event) => setDisplayOrder(Number(event.target.value))}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="mt-2 inline-flex items-center justify-center rounded-md bg-brass-deep px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-brass disabled:cursor-not-allowed disabled:opacity-45"
        >
          {status === "submitting" ? "Saving…" : "Save"}
        </button>
      </form>
    </Modal>
  );
}
