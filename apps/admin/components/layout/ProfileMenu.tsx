"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useAuth } from "../../lib/auth/AuthContext";

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  async function handleLogout() {
    setIsOpen(false);
    await logout();
    router.push("/login");
  }

  const initials = (user?.fullName ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full border border-white/10 py-1 pl-1 pr-3 text-[13.5px] text-porcelain hover:bg-white/5"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brass-deep text-[12px] font-semibold text-white">
          {initials}
        </span>
        <span className="hidden sm:inline">{user?.fullName}</span>
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-white/10 bg-ink-soft shadow-xl"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[13.5px] font-medium text-porcelain">
              {user?.fullName}
            </p>
            <p className="truncate text-[12.5px] text-porcelain/50">
              {user?.email}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center px-4 py-2.5 text-left text-[13.5px] text-porcelain/80 hover:bg-white/5 hover:text-porcelain"
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
