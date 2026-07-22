"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { RequireAdminAuth } from "../auth/RequireAdminAuth";
import { useAuth } from "../../lib/auth/AuthContext";
import { CommandPalette, type Command } from "../ui/CommandPalette";
import { Sidebar } from "./Sidebar";
import { ShortcutsHelp } from "./ShortcutsHelp";
import { TopNav } from "./TopNav";

const SIDEBAR_COLLAPSED_KEY = "maya-x-admin-sidebar-collapsed";

function AdminShellContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isCommandK =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const target = event.target as HTMLElement | null;
      const isTypingContext =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (isCommandK) {
        event.preventDefault();
        setCommandPaletteOpen((open) => !open);
      } else if (event.key === "?" && !isTypingContext) {
        event.preventDefault();
        setShortcutsOpen(true);
      } else if (event.key === "Escape") {
        setMobileDrawerOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  function toggleSidebar() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  const commands: Command[] = [
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      action: () => router.push("/"),
    },
    {
      id: "nav-talent",
      label: "Go to Talent",
      action: () => router.push("/talent"),
    },
    {
      id: "nav-media",
      label: "Go to Media Library",
      action: () => router.push("/media"),
    },
    {
      id: "nav-bookings",
      label: "Go to Bookings",
      action: () => router.push("/bookings"),
    },
    {
      id: "nav-talent-new",
      label: "Create new Talent",
      hint: "Talent",
      action: () => router.push("/talent/new"),
    },
    {
      id: "nav-cities",
      label: "Go to Cities",
      action: () => router.push("/cities"),
    },
    {
      id: "nav-locations",
      label: "Go to Locations",
      action: () => router.push("/locations"),
    },
    {
      id: "nav-categories",
      label: "Go to Categories",
      action: () => router.push("/categories"),
    },
    {
      id: "nav-membership",
      label: "Go to Membership",
      action: () => router.push("/membership"),
    },
    {
      id: "nav-payments",
      label: "Go to Payments",
      action: () => router.push("/payments"),
    },
    {
      id: "log-out",
      label: "Log out",
      action: () => {
        void logout().then(() => router.push("/login"));
      },
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-ink">
      {/* Desktop sidebar */}
      <aside
        className={[
          "hidden shrink-0 border-r border-white/10 bg-ink transition-all duration-200 lg:block",
          collapsed ? "w-[72px]" : "w-64",
        ].join(" ")}
      >
        <Sidebar collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileDrawerOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative h-full w-64 border-r border-white/10 bg-ink shadow-2xl">
            <Sidebar
              collapsed={false}
              onNavigate={() => setMobileDrawerOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onToggleSidebar={toggleSidebar}
          onOpenMobileDrawer={() => setMobileDrawerOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <CommandPalette
        commands={commands}
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
      <ShortcutsHelp
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RequireAdminAuth>
      <AdminShellContent>{children}</AdminShellContent>
    </RequireAdminAuth>
  );
}
