"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDisplayUsername } from "@/lib/auth/display";
import type { SessionUser } from "@/lib/auth/types";

export default function AdminHeader({ user }: { user: SessionUser }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/admin"
          className="text-sm font-semibold text-zinc-900 transition hover:text-amber-800 dark:text-zinc-50 dark:hover:text-amber-400"
        >
          Taller carpintería
        </Link>
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-1 sm:flex">
            <Link
              href="/admin/stock"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            >
              Ver stock
            </Link>
            <Link
              href="/admin/cotizador"
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
            >
              Cotizador
            </Link>
          </nav>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {getDisplayUsername(user.username)}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
