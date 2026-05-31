"use client";

import { Fragment, useMemo, useState } from "react";
import { BUYER_CONFIG, isFabricLikeEntry, MATERIAL_CONFIG } from "@/lib/materials/constants";
import EditStockDialog from "@/components/admin/EditStockDialog";
import {
  calculateTotalPrice,
  formatDate,
  formatEntryDetails,
  formatPrice,
  getUnitPrice,
} from "@/lib/materials/format";
import { groupStockEntries } from "@/lib/materials/grouping";
import type { StockEntry } from "@/lib/materials/types";

type StockInventoryTableProps = {
  entries: StockEntry[];
  onRefresh: () => Promise<void>;
  canWrite: boolean;
};

export default function StockInventoryTable({
  entries,
  onRefresh,
  canWrite,
}: StockInventoryTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);

  const groups = useMemo(() => groupStockEntries(entries), [entries]);

  const grandTotal = useMemo(
    () => entries.reduce((sum, entry) => sum + calculateTotalPrice(entry), 0),
    [entries],
  );

  const toggleGroup = (key: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (entries.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
        Todavía no hay ítems cargados. Usá el formulario de arriba para empezar.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Detalle
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Comprado por
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Cantidad
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Precio total
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Registros
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {groups.map((group) => {
              const sample = group.entries[0];
              const isExpanded = expandedGroups.has(group.key);
              const hasMultiple = group.entries.length > 1;

              return (
                <Fragment key={group.key}>
                  <tr className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {MATERIAL_CONFIG[sample.type].label}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {formatEntryDetails(sample)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-700 dark:text-zinc-300">
                      {BUYER_CONFIG[sample.compradoPor].label}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
                      {group.totalQuantity.toLocaleString("es-AR")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
                      {formatPrice(group.totalPrice)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.key)}
                        className="font-medium text-amber-700 transition hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                      >
                        {hasMultiple
                          ? `${group.entries.length} compras · ${isExpanded ? "Ocultar" : "Ver"}`
                          : "1 compra · Ver"}
                      </button>
                    </td>
                  </tr>

                  {isExpanded &&
                    group.entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="bg-zinc-50/80 dark:bg-zinc-900/30"
                      >
                        <td
                          className="px-6 py-3 text-xs text-zinc-500"
                          colSpan={2}
                        >
                          Compra del {formatDate(entry.updatedAt)}
                        </td>
                        <td className="px-6 py-3 text-xs text-zinc-500">
                          {BUYER_CONFIG[entry.compradoPor].label}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-right text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
                          {entry.quantity.toLocaleString("es-AR")}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-right text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
                          <div>{formatPrice(calculateTotalPrice(entry))}</div>
                          <div className="text-zinc-500">
                            {formatPrice(getUnitPrice(entry))} c/u
                            {isFabricLikeEntry(entry) && ` (${formatPrice(entry.price)}/m)`}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-3">
                          {canWrite ? (
                            <button
                              type="button"
                              onClick={() => setEditingEntry(entry)}
                              className="text-xs font-medium text-amber-700 transition hover:text-amber-800 dark:text-amber-400"
                            >
                              Editar
                            </button>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
            <tr>
              <td
                colSpan={4}
                className="px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50"
              >
                Inversión total ({entries.length}{" "}
                {entries.length === 1 ? "registro" : "registros"})
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">
                {formatPrice(grandTotal)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {canWrite && (
        <EditStockDialog
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={onRefresh}
        />
      )}
    </>
  );
}
