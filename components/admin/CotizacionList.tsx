"use client";

import { formatPrice } from "@/lib/materials/format";
import { getDisplayUsername } from "@/lib/auth/display";
import { isCotizacionOwnedBy } from "@/lib/cotizador/permissions";
import {
  getQuoteLineCost,
  type CommittedQuoteLine,
} from "@/lib/materials/quote-line";
import type { QuoteProductOption } from "@/lib/materials/quote-products";
import type { Cotizacion } from "@/lib/cotizador/types";

type CotizacionListProps = {
  cotizaciones: Cotizacion[];
  productMap: Map<string, QuoteProductOption>;
  canWrite: boolean;
  currentUsername: string;
  duplicatingId?: string | null;
  onOpen: (id: string) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
};

function getCotizacionTotal(
  cotizacion: Cotizacion,
  productMap: Map<string, QuoteProductOption>,
): number {
  return cotizacion.materiales.reduce(
    (sum, line) =>
      sum + getQuoteLineCost(line, productMap.get(line.productKey)),
    0,
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const iconButtonClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-60";

function EyeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M10 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path
        fillRule="evenodd"
        d="M.664 10.59a1.651 1.651 0 0 1 0-1.186A10.004 10.004 0 0 1 10 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0 1 10 17c-4.257 0-7.893-2.66-9.336-6.41ZM14 10a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Icono de documentos apilados: sugerencia clara para “duplicar”. */
function DuplicateIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h5.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 1 .439 1.061V12.5A1.5 1.5 0 0 1 16.5 14h-1v-1.5a.5.5 0 0 0-.5-.5h1V5.621L14.379 3.5H8.5a.5.5 0 0 0-.5.5v1H7V3.5Z" />
      <path d="M3.5 6A1.5 1.5 0 0 0 2 7.5v9A1.5 1.5 0 0 0 3.5 18h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 11.5 6h-8Z" />
    </svg>
  );
}

export default function CotizacionList({
  cotizaciones,
  productMap,
  canWrite,
  currentUsername,
  duplicatingId = null,
  onOpen,
  onCreate,
  onDuplicate,
}: CotizacionListProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Cotizaciones
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {cotizaciones.length}{" "}
            {cotizaciones.length === 1 ? "registro" : "registros"}
          </p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-700 px-4 text-sm font-medium text-white transition hover:bg-amber-800"
          >
            Nueva cotización
          </button>
        )}
      </div>

      {cotizaciones.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {canWrite
            ? "Todavía no hay cotizaciones. Creá la primera con el botón de arriba."
            : "Todavía no hay cotizaciones guardadas."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:px-6">
                  Nombre
                </th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Descripción
                </th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Materiales
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:px-6">
                  Costo
                </th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Creada por
                </th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Actualizado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:px-6">
                  &nbsp;
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {cotizaciones.map((cotizacion) => {
                const total = getCotizacionTotal(cotizacion, productMap);
                const isOwn = isCotizacionOwnedBy(
                  currentUsername,
                  cotizacion,
                );

                return (
                  <tr
                    key={cotizacion.id}
                    className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                  >
                    <td className="max-w-[40vw] px-4 py-4 sm:px-6">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {cotizacion.nombre}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {getDisplayUsername(cotizacion.createdBy)}
                        {isOwn && (
                          <span className="ml-1 text-amber-700 dark:text-amber-400">
                            (tuya)
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="hidden max-w-xs truncate px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 md:table-cell">
                      {cotizacion.descripcion.trim() || "—"}
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 md:table-cell">
                      {cotizacion.materiales.length}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm tabular-nums font-medium text-zinc-900 sm:px-6 dark:text-zinc-50">
                      {total > 0 ? formatPrice(total) : "—"}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 md:table-cell">
                      {getDisplayUsername(cotizacion.createdBy)}
                      {isOwn && (
                        <span className="ml-1 text-xs text-amber-700 dark:text-amber-400">
                          (tuya)
                        </span>
                      )}
                    </td>
                    <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 md:table-cell">
                      {formatDate(cotizacion.updatedAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right sm:px-6">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onOpen(cotizacion.id)}
                          title="Ver"
                          aria-label={`Ver ${cotizacion.nombre}`}
                          className={`${iconButtonClassName} text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30`}
                        >
                          <EyeIcon />
                        </button>
                        {canWrite && (
                          <button
                            type="button"
                            onClick={() => onDuplicate(cotizacion.id)}
                            disabled={duplicatingId === cotizacion.id}
                            title="Duplicar"
                            aria-label={`Duplicar ${cotizacion.nombre}`}
                            className={`${iconButtonClassName} text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900`}
                          >
                            <DuplicateIcon />
                          </button>
                        )}
                      </div>
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

export function getMaterialesTotal(
  materiales: CommittedQuoteLine[],
  productMap: Map<string, QuoteProductOption>,
): number {
  return materiales.reduce(
    (sum, line) =>
      sum + getQuoteLineCost(line, productMap.get(line.productKey)),
    0,
  );
}
