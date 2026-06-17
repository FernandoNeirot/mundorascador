"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getMaterialesTotal } from "@/components/admin/CotizacionList";
import { formatPrice } from "@/lib/materials/format";
import type { QuoteProductOption } from "@/lib/materials/quote-products";
import { computeRascadorEnsamble } from "@/lib/ensamble/cat-scratcher";
import type { Ensamble } from "@/lib/ensamble/types";
import { useTenantPaths } from "@/lib/tenant/context";

type EnsambleCotizadorSectionProps = {
  ensambles: Ensamble[];
  productMap: Map<string, QuoteProductOption>;
  canWrite: boolean;
  currentUsername: string;
};

export default function EnsambleCotizadorSection({
  ensambles,
  productMap,
  canWrite,
  currentUsername,
}: EnsambleCotizadorSectionProps) {
  const { path } = useTenantPaths();
  const rows = useMemo(() => {
    return ensambles.map((ensamble) => {
      const computed = computeRascadorEnsamble(ensamble.config);
      const total = getMaterialesTotal(ensamble.materiales, productMap);
      const canOpen =
        canWrite &&
        ensamble.createdBy.toLowerCase() === currentUsername.toLowerCase();
      return {
        ensamble,
        pisos: computed.niveles.length,
        piezas: computed.piezas.length,
        total,
        canOpen,
      };
    });
  }, [ensambles, productMap, canWrite, currentUsername]);

  if (ensambles.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 shadow-sm sm:p-6 dark:border-violet-900/50 dark:bg-violet-950/20">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Ensambles (diseño + cotización)
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Cada ensamble guarda el modelo y los materiales en un solo documento.
            Abrilo para cotizar con tela, hilo y tornillos.
          </p>
        </div>
        {canWrite && (
          <Link
            href={path("ensamble", "nuevo")}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-violet-700 px-4 text-sm font-medium text-white transition hover:bg-violet-800"
          >
            Nuevo ensamble
          </Link>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map(({ ensamble, pisos, piezas, total, canOpen }) => (
          <li
            key={ensamble.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-200/80 bg-white px-4 py-3 dark:border-violet-900/40 dark:bg-zinc-950"
          >
            <div className="min-w-0">
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {ensamble.config.nombre || "Sin nombre"}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {pisos} pisos · {piezas} piezas · {ensamble.materiales.length}{" "}
                líneas cotizadas
                {total > 0 && (
                  <>
                    {" "}
                    · <span className="tabular-nums">{formatPrice(total)}</span>
                  </>
                )}
              </p>
            </div>
            <Link
              href={path("ensamble", ensamble.id)}
              className={`text-sm font-medium ${
                canOpen
                  ? "text-violet-700 hover:underline dark:text-violet-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              {canOpen ? "Cotizar / editar" : "Ver"}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
