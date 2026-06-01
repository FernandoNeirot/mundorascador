"use client";

import type { QuoteProductOption } from "@/lib/materials/quote-products";

const detailLabelClassName =
  "text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

const detailValueClassName =
  "text-sm text-zinc-900 dark:text-zinc-50";

function unitShort(unit: QuoteProductOption["quantityUnit"]): string {
  if (unit === "metros") return "m";
  if (unit === "cm") return "cm";
  if (unit === "cm²") return "cm²";
  return "u";
}

type CollapsibleProductDetailsProps = {
  product: QuoteProductOption;
  expanded: boolean;
  onToggle: () => void;
  formatPrice: (price: number) => string;
};

export default function CollapsibleProductDetails({
  product,
  expanded,
  onToggle,
  formatPrice,
}: CollapsibleProductDetailsProps) {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
      >
        <span className="min-w-0 truncate text-zinc-700 dark:text-zinc-300">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {product.descripcion}
          </span>
          <span className="text-zinc-500 dark:text-zinc-400">
            {" "}
            · {product.materialLabel}
          </span>
        </span>
        <span className="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-400">
          {expanded ? "Ocultar" : "Ver info"}
        </span>
      </button>

      {expanded && (
        <dl className="grid gap-3 border-t border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="flex flex-col gap-1">
            <dt className={detailLabelClassName}>Tipo</dt>
            <dd className={detailValueClassName}>{product.materialLabel}</dd>
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <dt className={detailLabelClassName}>Detalle</dt>
            <dd className={detailValueClassName}>{product.details}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className={detailLabelClassName}>Precio unitario</dt>
            <dd className={`${detailValueClassName} tabular-nums`}>
              {formatPrice(product.unitPrice)}/{unitShort(product.quantityUnit)}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
