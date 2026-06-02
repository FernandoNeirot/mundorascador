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
  onOpen: (id: string) => void;
  onCreate: () => void;
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

export default function CotizacionList({
  cotizaciones,
  productMap,
  canWrite,
  currentUsername,
  onOpen,
  onCreate,
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
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Nombre
                </th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 sm:table-cell">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Materiales
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Total
                </th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 md:table-cell">
                  Creada por
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
                    <td className="px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {cotizacion.nombre}
                    </td>
                    <td className="hidden max-w-xs truncate px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 sm:table-cell">
                      {cotizacion.descripcion.trim() || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      {cotizacion.materiales.length}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
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
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpen(cotizacion.id)}
                        className="text-sm font-medium text-amber-700 transition hover:text-amber-800 dark:text-amber-400"
                      >
                        Ver
                      </button>
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
