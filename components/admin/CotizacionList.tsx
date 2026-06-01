"use client";

import { formatPrice } from "@/lib/materials/format";
import {
  getQuoteLineCost,
  type CommittedQuoteLine,
} from "@/lib/materials/quote-line";
import type { QuoteProductOption } from "@/lib/materials/quote-products";
import type { Cotizacion } from "@/lib/cotizador/types";

type CotizacionListProps = {
  cotizaciones: Cotizacion[];
  selectedId: string | null;
  productMap: Map<string, QuoteProductOption>;
  canWrite: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  creating: boolean;
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
  selectedId,
  productMap,
  canWrite,
  onSelect,
  onCreate,
  creating,
}: CotizacionListProps) {
  return (
    <aside className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Cotizaciones
        </p>
        {canWrite && (
          <button
            type="button"
            onClick={onCreate}
            disabled={creating}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-amber-700 px-3 text-xs font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Creando..." : "Nueva"}
          </button>
        )}
      </div>

      {cotizaciones.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Todavía no hay cotizaciones guardadas.
        </p>
      ) : (
        <ul className="flex max-h-[420px] min-w-0 flex-col gap-2 overflow-y-auto lg:max-h-none">
          {cotizaciones.map((cotizacion) => {
            const total = getCotizacionTotal(cotizacion, productMap);
            const isSelected = cotizacion.id === selectedId;

            return (
              <li key={cotizacion.id}>
                <button
                  type="button"
                  onClick={() => onSelect(cotizacion.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    isSelected
                      ? "border-amber-600 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/30"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
                  }`}
                >
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {cotizacion.nombre}
                  </p>
                  <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {cotizacion.materiales.length}{" "}
                    {cotizacion.materiales.length === 1
                      ? "material"
                      : "materiales"}
                    {total > 0 && (
                      <>
                        {" "}
                        ·{" "}
                        <span className="tabular-nums font-medium text-zinc-700 dark:text-zinc-300">
                          {formatPrice(total)}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                    {formatDate(cotizacion.updatedAt)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
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
