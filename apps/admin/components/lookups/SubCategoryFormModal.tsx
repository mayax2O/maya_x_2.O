"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "../../lib/api/client";
import { listAllActiveCategories } from "../../lib/data/lookups";
import {
  createSubCategory,
  updateSubCategory,
} from "../../lib/data/subcategories";
import type { TalentCategory, TalentSubCategory } from "../../lib/types";
import { Modal } from "../ui/Modal";
import { useToast } from "../ui/Toast";

export function SubCategoryFormModal({
  subCategory,
  isOpen,
  onClose,
  onSaved,
}: {
  subCategory?: TalentSubCategory;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (subCategory: TalentSubCategory) => void;
}) {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<TalentCategory[]>([]);
  const [categoryId, setCategoryId] = useState(subCategory?.categoryId ?? "");
  const [name, setName] = useState(subCategory?.name ?? "");
  const [slug, setSlug] = useState(subCategory?.slug ?? "");
  const [displayOrder, setDisplayOrder] = useState(
    subCategory?.displayOrder ?? 0,
  );
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    listAllActiveCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [isOpen]);

  useEffect(() => {
    setCategoryId(subCategory?.categoryId ?? "");
    setName(subCategory?.name ?? "");
    setSlug(subCategory?.slug ?? "");
    setDisplayOrder(subCategory?.displayOrder ?? 0);
  }, [subCategory]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setStatus("submitting");
    try {
      const saved = subCategory
        ? await updateSubCategory(subCategory.id, {
            categoryId,
            name,
            slug: slug || undefined,
            displayOrder,
          })
        : await createSubCategory({
            categoryId,
            name,
            slug: slug || undefined,
            displayOrder,
          });
      showToast(
        subCategory ? "Sub-category updated." : "Sub-category created.",
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
      title={subCategory ? "Edit sub-category" : "Add sub-category"}
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
            htmlFor="subcategory-category"
            className="text-[13px] font-medium text-porcelain/70"
          >
            Category
          </label>
          <select
            id="subcategory-category"
            required
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="subcategory-name"
            className="text-[13px] font-medium text-porcelain/70"
          >
            Sub-category name
          </label>
          <input
            id="subcategory-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="subcategory-slug"
            className="text-[13px] font-medium text-porcelain/70"
          >
            Slug (auto-generated if left blank)
          </label>
          <input
            id="subcategory-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            className="rounded-md border border-white/15 bg-ink px-3 py-2 text-[14px] text-porcelain focus:border-brass focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="subcategory-order"
            className="text-[13px] font-medium text-porcelain/70"
          >
            Display order
          </label>
          <input
            id="subcategory-order"
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
