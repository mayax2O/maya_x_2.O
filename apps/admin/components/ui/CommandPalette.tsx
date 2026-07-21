"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

export interface Command {
  id: string;
  label: string;
  hint?: string;
  action: () => void;
}

/**
 * Filterable, arrow-key navigable, Enter-to-run, Escape-to-close. Open
 * state is controlled by the parent (AdminShell), which also owns the
 * global Ctrl+K listener so the same shortcut can toggle it from
 * anywhere, including the TopNav search button.
 */
export function CommandPalette({
  commands,
  isOpen,
  onClose,
}: {
  commands: Command[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setQuery("");
    setActiveIndex(0);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((command) =>
      command.label.toLowerCase().includes(q),
    );
  }, [commands, query]);

  function runCommand(command: Command) {
    onClose();
    command.action();
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const command = filtered[activeIndex];
      if (command) runCommand(command);
    } else if (event.key === "Escape") {
      onClose();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 pt-24"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-lg overflow-hidden rounded-lg border border-white/10 bg-ink-soft shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="h-4 w-4 shrink-0 text-porcelain/50"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="M20 20l-4.5-4.5" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Type a command or search..."
            aria-label="Search commands"
            className="w-full bg-transparent text-[14.5px] text-porcelain placeholder:text-porcelain/40 focus:outline-none"
          />
          <kbd className="rounded border border-white/20 px-1.5 py-0.5 text-[11px] text-porcelain/50">
            Esc
          </kbd>
        </div>
        <ul role="listbox" className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <li className="px-4 py-6 text-center text-[13.5px] text-porcelain/50">
              No matching commands
            </li>
          ) : (
            filtered.map((command, index) => (
              <li
                key={command.id}
                role="option"
                aria-selected={index === activeIndex}
              >
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => runCommand(command)}
                  className={[
                    "flex w-full items-center justify-between px-4 py-2.5 text-left text-[14px]",
                    index === activeIndex
                      ? "bg-brass-deep/20 text-porcelain"
                      : "text-porcelain/80",
                  ].join(" ")}
                >
                  <span>{command.label}</span>
                  {command.hint ? (
                    <span className="text-[12px] text-porcelain/40">
                      {command.hint}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
