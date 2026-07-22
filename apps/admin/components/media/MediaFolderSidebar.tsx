"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { ApiError } from "../../lib/api/client";
import {
  createMediaFolder,
  deleteMediaFolder,
  updateMediaFolder,
} from "../../lib/data/media";
import type { MediaFolder } from "../../lib/types";
import { useToast } from "../ui/Toast";

const inputClassName =
  "rounded-md border border-white/15 bg-ink px-3 py-2 text-[13.5px] text-porcelain focus:border-brass focus:outline-none";

export function MediaFolderSidebar({
  folders,
  activeFolderId,
  onSelect,
  onFoldersChange,
}: {
  folders: MediaFolder[];
  activeFolderId: string | undefined;
  onSelect: (folderId: string | undefined) => void;
  onFoldersChange: () => void;
}) {
  const { showToast } = useToast();
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await createMediaFolder(newFolderName.trim());
      setNewFolderName("");
      setCreating(false);
      onFoldersChange();
      showToast("Folder created.", "success");
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Failed to create folder.",
        "error",
      );
    }
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return;
    try {
      await updateMediaFolder(id, renameValue.trim());
      setRenamingId(null);
      onFoldersChange();
      showToast("Folder renamed.", "success");
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Failed to rename folder.",
        "error",
      );
    }
  }

  async function handleDelete(folder: MediaFolder) {
    if (
      !window.confirm(
        `Delete the "${folder.name}" folder? Its images will need to be empty first.`,
      )
    ) {
      return;
    }
    try {
      await deleteMediaFolder(folder.id);
      if (activeFolderId === folder.id) onSelect(undefined);
      onFoldersChange();
      showToast("Folder deleted.", "success");
    } catch (error) {
      showToast(
        error instanceof ApiError ? error.message : "Failed to delete folder.",
        "error",
      );
    }
  }

  return (
    <nav aria-label="Media folders" className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => onSelect(undefined)}
        aria-current={activeFolderId === undefined ? "true" : undefined}
        className={[
          "rounded-md px-3 py-2 text-left text-[13.5px] font-medium transition-colors",
          activeFolderId === undefined
            ? "bg-brass-deep/20 text-brass"
            : "text-porcelain/70 hover:bg-white/5 hover:text-porcelain",
        ].join(" ")}
      >
        All files
      </button>

      {folders.map((folder) => (
        <div key={folder.id} className="group flex items-center gap-1">
          {renamingId === folder.id ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleRename(folder.id);
              }}
              className="flex flex-1 items-center gap-1 px-1"
            >
              <input
                autoFocus
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                onBlur={() => setRenamingId(null)}
                className={`${inputClassName} flex-1 py-1`}
              />
            </form>
          ) : (
            <button
              type="button"
              onClick={() => onSelect(folder.id)}
              aria-current={activeFolderId === folder.id ? "true" : undefined}
              className={[
                "flex-1 truncate rounded-md px-3 py-2 text-left text-[13.5px] font-medium transition-colors",
                activeFolderId === folder.id
                  ? "bg-brass-deep/20 text-brass"
                  : "text-porcelain/70 hover:bg-white/5 hover:text-porcelain",
              ].join(" ")}
            >
              {folder.name}{" "}
              <span className="text-porcelain/40">({folder.assetCount})</span>
            </button>
          )}
          <div className="hidden gap-1 pr-1 group-hover:flex">
            <button
              type="button"
              onClick={() => {
                setRenamingId(folder.id);
                setRenameValue(folder.name);
              }}
              aria-label={`Rename ${folder.name}`}
              className="rounded p-1 text-porcelain/40 hover:text-porcelain"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-3.5 w-3.5"
              >
                <path d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17.2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleDelete(folder)}
              aria-label={`Delete ${folder.name}`}
              className="rounded p-1 text-porcelain/40 hover:text-danger"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-3.5 w-3.5"
              >
                <path d="M6 7h12M9 7V5h6v2m-8 0 1 13h8l1-13" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {creating ? (
        <form onSubmit={handleCreate} className="flex flex-col gap-2 px-1 py-2">
          <input
            autoFocus
            placeholder="Folder name"
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
            className={inputClassName}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-brass-deep px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-brass"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-md border border-white/15 px-3 py-1.5 text-[12.5px] text-porcelain/70 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="mt-1 rounded-md px-3 py-2 text-left text-[13px] text-porcelain/50 hover:bg-white/5 hover:text-porcelain"
        >
          + New folder
        </button>
      )}
    </nav>
  );
}
