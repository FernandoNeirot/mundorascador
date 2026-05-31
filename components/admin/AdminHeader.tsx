"use client";

import { useRouter } from "next/navigation";
import { ROLE_LABELS } from "@/lib/auth/constants";
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
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {user.username}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
