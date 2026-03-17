"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Send,
  Home,
  MessageSquare,
  History,
  Coins,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const senderNav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/dashboard/submit", label: "Kirim Menfess", icon: MessageSquare },
  { href: "/dashboard/history", label: "Riwayat", icon: History },
  { href: "/dashboard/topup", label: "Top-Up Koin", icon: Coins },
];

const baseOwnerNav = [
  { href: "/base-owner/onboarding", label: "Integrasi Base", icon: Settings },
  { href: "/base-owner/settings", label: "Pengaturan Base", icon: Settings },
  { href: "/base-owner/rules", label: "Rules Editor", icon: MessageSquare },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userRole = (session?.user as { role?: string })?.role;
  const isBaseOwner = userRole === "base_owner" || userRole === "admin";

  return (
    <div className="min-h-screen bg-bg-dark flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-bg-card border-r border-border z-50 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">Easyfess</span>
          </Link>
          <button
            className="lg:hidden text-text-secondary"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 mb-3">
            Sender
          </div>
          {senderNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
                }`}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </Link>
            );
          })}

          {isBaseOwner && (
            <>
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wider px-3 mt-6 mb-3">
                Base Owner
              </div>
              {baseOwnerNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {session?.user?.name ?? "User"}
              </div>
              <div className="text-xs text-text-muted truncate">
                @{(session?.user as { xUsername?: string })?.xUsername ?? "anonymous"}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-danger hover:bg-danger/10 w-full transition-all"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 glass px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-bg-card-hover"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold gradient-text">Easyfess</span>
        </div>

        <div className="p-6 lg:p-8 max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
