"use client";

import Link from "next/link";
import { startPageNavigation } from "@/lib/navigation-loading";
import { usePathname, useRouter } from "next/navigation";
import { getDisplayUsername } from "@/lib/auth/display";
import type { SessionUser } from "@/lib/auth/types";

const NAV_LINKS = [
  { href: "/admin/stock", label: "Ver stock" },
  { href: "/admin/cotizador", label: "Cotizador" },
  { href: "/admin/optimizador", label: "Optimizador" },
  { href: "/admin/ensamble", label: "Ensamble" },
] as const;

const linkClassName =
  "rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50";

const activeLinkClassName =
  "rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";

function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminHeader({ user }: { user: SessionUser }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    startPageNavigation();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <Link
          href="/admin"
          className="shrink-0 text-sm font-semibold text-zinc-900 transition hover:text-amber-800 dark:text-zinc-50 dark:hover:text-amber-400"
        >
          Taller carpintería
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActivePath(pathname, link.href)
                    ? activeLinkClassName
                    : linkClassName
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="hidden text-sm font-medium text-zinc-700 sm:inline dark:text-zinc-300">
            {getDisplayUsername(user.username)}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 sm:h-10 sm:px-4 sm:text-sm dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Salir
          </button>
        </div>
      </div>

      <nav
        aria-label="Administración"
        className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 pb-3 sm:hidden"
      >
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 ${
              isActivePath(pathname, link.href)
                ? activeLinkClassName
                : linkClassName
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
