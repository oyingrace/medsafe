"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import {
  LayoutDashboard,
  PackagePlus,
  PackageSearch,
  ShieldCheck,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/register", label: "Register Batch", icon: PackagePlus },
  { href: "/dashboard/batches", label: "Batches", icon: PackageSearch },
];

export function DashboardSidebar({ username }: { username: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 flex-col border-r border-zinc-200 bg-white">
      {/* Brand */}
      <div className="flex items-center gap-2.5 border-b border-zinc-100 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold leading-none text-zinc-900">MedSafe</p>
          <p className="mt-0.5 text-[11px] text-zinc-400">Manufacturer Portal</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-green-50 text-green-700"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${active ? "text-green-600" : "text-zinc-400"}`}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-zinc-100 px-3 py-4">
        <div className="mb-3 flex items-center gap-2.5 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs font-bold uppercase text-green-700">
            {username.slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-semibold text-zinc-800">{username}</p>
            <p className="text-[11px] text-zinc-400">Manufacturer</p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
