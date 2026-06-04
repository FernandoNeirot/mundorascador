import EnsambleList from "@/components/admin/EnsambleList";
import { canWriteEnsamble } from "@/lib/auth/permissions";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getEnsambles } from "@/lib/ensamble/ensamble-storage";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminEnsamblePage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const ensambles = await getEnsambles();

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <Link
          href="/admin"
          className="text-sm font-medium text-amber-700 transition hover:text-amber-800 dark:text-amber-400"
        >
          ← Volver al panel
        </Link>
        <p className="mt-4 text-sm font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Administración
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Ensamble
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Diseños de rascadores y otros ensambles guardados en Firebase. Abrí
          uno para ver el detalle; solo el autor puede modificarlo.
        </p>
      </header>

      <EnsambleList
        ensambles={ensambles}
        canWrite={canWriteEnsamble(session)}
        currentUsername={session.username}
      />
    </div>
  );
}
