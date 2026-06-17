"use client";

import Link from "next/link";
import { getDisplayUsername } from "@/lib/auth/display";
import { computeRascadorEnsamble } from "@/lib/ensamble/cat-scratcher";
import { isEnsambleOwnedBy } from "@/lib/ensamble/permissions";
import type { Ensamble } from "@/lib/ensamble/types";
import { useTenantPaths } from "@/lib/tenant/context";

type EnsambleListProps = {
  ensambles: Ensamble[];
  canWrite: boolean;
  currentUsername: string;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function tipoLabel(tipo: Ensamble["tipo"]): string {
  if (tipo === "rascador-gatos") return "Rascador gatos";
  return tipo;
}

export default function EnsambleList({
  ensambles,
  canWrite,
  currentUsername,
}: EnsambleListProps) {
  const { path } = useTenantPaths();

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Ensambles guardados
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {ensambles.length}{" "}
            {ensambles.length === 1 ? "registro" : "registros"}
          </p>
        </div>
        {canWrite && (
          <Link
            href={path("ensamble", "nuevo")}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-700 px-4 text-sm font-medium text-white transition hover:bg-amber-800"
          >
            Nuevo ensamble
          </Link>
        )}
      </div>

      {ensambles.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {canWrite
            ? "Todavía no hay ensambles. Creá el primero con el botón de arriba."
            : "Todavía no hay ensambles guardados."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Nombre
                </th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Pisos
                </th>
                <th className="hidden px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Alto total
                </th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Creado por
                </th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Actualizado
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {ensambles.map((ensamble) => {
                const computed = computeRascadorEnsamble(ensamble.config);
                const isOwn = isEnsambleOwnedBy(currentUsername, ensamble);

                return (
                  <tr
                    key={ensamble.id}
                    className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {ensamble.config.nombre}
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 sm:table-cell">
                      {tipoLabel(ensamble.tipo)}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {computed.niveles.length}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-right text-sm tabular-nums text-zinc-600 dark:text-zinc-400 sm:table-cell">
                      {computed.alturaTotalCm.toFixed(0)} cm
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 md:table-cell">
                      {getDisplayUsername(ensamble.createdBy)}
                      {isOwn && (
                        <span className="ml-1 text-xs text-amber-700 dark:text-amber-400">
                          (tuyo)
                        </span>
                      )}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 md:table-cell">
                      {formatDate(ensamble.updatedAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link
                        href={path("ensamble", ensamble.id)}
                        className="text-sm font-medium text-amber-700 transition hover:text-amber-800 dark:text-amber-400"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
