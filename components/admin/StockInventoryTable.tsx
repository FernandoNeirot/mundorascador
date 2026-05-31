"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { BUYER_CONFIG, isMeterBasedEntry, MATERIAL_CONFIG } from "@/lib/materials/constants";
import EditStockDialog from "@/components/admin/EditStockDialog";
import {
  calculateTotalPrice,
  formatDate,
  formatEntryDetails,
  formatPrice,
  getCantidadUsada,
  getQuantityUnitShort,
  getRemainingQuantity,
  getUnitPrice,
} from "@/lib/materials/format";
import { groupStockEntries } from "@/lib/materials/grouping";
import { filterStockGroups } from "@/lib/materials/stock-search";
import type { StockEntry } from "@/lib/materials/types";

const PAGE_SIZE = 5;

const searchInputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const groups = useMemo(() => groupStockEntries(entries), [entries]);

  const filteredGroups = useMemo(
    () => filterStockGroups(groups, searchQuery),
    [groups, searchQuery],
  );

  const grandTotal = useMemo(
    () => entries.reduce((sum, entry) => sum + calculateTotalPrice(entry), 0),
    [entries],
  );

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / PAGE_SIZE));

  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredGroups.slice(start, start + PAGE_SIZE);
  }, [filteredGroups, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedGroups(new Set());
  }, [entries.length, searchQuery]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
        Todavía no hay ítems cargados. Usá el botón Agregar para empezar.
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Buscar
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tipo, descripción, color, comprador, medidas..."
            className={searchInputClassName}
          />
        </label>
        {searchQuery.trim() && (
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {filteredGroups.length}{" "}
            {filteredGroups.length === 1 ? "resultado" : "resultados"}
          </p>
        )}
      </div>

      {filteredGroups.length === 0 ? (
        <div className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
          No hay resultados para &ldquo;{searchQuery.trim()}&rdquo;.
        </div>
      ) : (
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
                Stock
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Usado
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Restante
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
            {paginatedGroups.map((group) => {
              const sample = group.entries[0];
              const unit = getQuantityUnitShort(sample.type);
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
                      {group.totalQuantity.toLocaleString("es-AR")} {unit}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm tabular-nums text-zinc-700 dark:text-zinc-300">
                      {group.totalCantidadUsada.toLocaleString("es-AR")} {unit}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                      {group.stockRestante.toLocaleString("es-AR")} {unit}
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
                    group.entries.map((entry) => {
                      const entryUnit = getQuantityUnitShort(entry.type);
                      const remaining = getRemainingQuantity(entry);

                      return (
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
                          {entry.quantity.toLocaleString("es-AR")} {entryUnit}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-right text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
                          {getCantidadUsada(entry).toLocaleString("es-AR")}{" "}
                          {entryUnit}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-right text-xs tabular-nums font-medium text-emerald-700 dark:text-emerald-400">
                          {remaining.toLocaleString("es-AR")} {entryUnit}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-right text-xs tabular-nums text-zinc-700 dark:text-zinc-300">
                          <div>{formatPrice(calculateTotalPrice(entry))}</div>
                          <div className="text-zinc-500">
                            {isMeterBasedEntry(entry)
                              ? `${formatPrice(entry.price)}/m × ${entry.quantity.toLocaleString("es-AR")} m`
                              : `${formatPrice(getUnitPrice(entry))} c/u`}
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
                      );
                    })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      )}

      {filteredGroups.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage <= 1}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage >= totalPages}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-300 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1 border-t border-zinc-200 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Total de registros: {entries.length.toLocaleString("es-AR")}
        </p>
        <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          Inversión total: {formatPrice(grandTotal)}
        </p>
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
