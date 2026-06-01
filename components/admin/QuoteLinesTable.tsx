"use client";

import { formatPrice } from "@/lib/materials/format";
import {
  formatQuoteLineQuantity,
  getQuoteLineCost,
} from "@/lib/materials/quote-line";
import type { QuoteProductOption } from "@/lib/materials/quote-products";
import type { CommittedQuoteLine } from "@/lib/materials/quote-line";

type QuoteLinesTableProps = {
  lines: CommittedQuoteLine[];
  productMap: Map<string, QuoteProductOption>;
  onEdit: (line: CommittedQuoteLine) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
};

const iconButtonClassName =
  "inline-flex h-9 w-9 items-center justify-center rounded-md transition sm:h-8 sm:w-8";

function EditIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="m2.695 14.363 1.092-3.81a1 1 0 0 1 .257-.365l8.46-8.46a2.25 2.25 0 0 1 3.182 3.182l-8.46 8.46a1 1 0 0 1-.365.257l-3.81 1.092a.75.75 0 0 1-.944-.944ZM14.03 4.97a1.5 1.5 0 0 0-2.121 0l-.879.879 2.121 2.121.879-.879a1.5 1.5 0 0 0 0-2.121Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 0 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.493.153l.828 10.13a1 1 0 0 0 .997.92h.01a1 1 0 0 0 .997-.92l.828-10.13a.75.75 0 0 0-1.493-.152L10 17.79l-.42-10.07Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function QuoteLinesTable({
  lines,
  productMap,
  onEdit,
  onDelete,
  readOnly = false,
}: QuoteLinesTableProps) {
  if (lines.length === 0) {
    return (
      <p className="w-full rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Todavía no hay materiales. Usá &quot;Agregar material&quot; para empezar.
      </p>
    );
  }

  return (
    <div className="w-full min-w-0 rounded-xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full table-fixed text-left">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/50">
            <th className="px-3 py-3 text-sm font-medium text-zinc-700 sm:px-4 dark:text-zinc-300">
              Producto
            </th>
            <th className="w-[5.5rem] px-2 py-3 text-right text-sm font-medium text-zinc-700 sm:w-28 sm:px-4 dark:text-zinc-300">
              Costo
            </th>
            {!readOnly && (
              <th className="w-[4.75rem] px-1 py-3 text-right text-sm font-medium text-zinc-700 sm:w-20 sm:px-2 dark:text-zinc-300">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const product = productMap.get(line.productKey);
            const cost = getQuoteLineCost(line, product);
            const measureLabel = formatQuoteLineQuantity(line, product);

            return (
              <tr
                key={line.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
              >
                <td className="px-3 py-3 sm:px-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-50">
                      {product?.descripcion ?? "—"}
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-zinc-500 sm:text-sm dark:text-zinc-400">
                      {measureLabel}
                    </p>
                  </div>
                </td>
                <td className="px-2 py-3 text-right align-middle sm:px-4">
                  <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {formatPrice(cost)}
                  </span>
                </td>
                {!readOnly && (
                  <td className="px-1 py-3 align-middle sm:px-2">
                    <div className="flex justify-end gap-0.5">
                      <button
                        type="button"
                        onClick={() => onEdit(line)}
                        title="Editar"
                        aria-label="Editar"
                        className={`${iconButtonClassName} text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30`}
                      >
                        <EditIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(line.id)}
                        title="Eliminar"
                        aria-label="Eliminar"
                        className={`${iconButtonClassName} text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
