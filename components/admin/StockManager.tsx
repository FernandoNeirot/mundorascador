"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AddStockDialog from "@/components/admin/AddStockDialog";
import StockInventoryTable from "@/components/admin/StockInventoryTable";
import type { StockEntry } from "@/lib/materials/types";
import { useTenantPaths } from "@/lib/tenant/context";

export default function StockManager({
  initialEntries,
  canWrite,
}: {
  initialEntries: StockEntry[];
  canWrite: boolean;
}) {
  const { basePath, materialsApi } = useTenantPaths();
  const [entries, setEntries] = useState(initialEntries);
  const [addOpen, setAddOpen] = useState(false);
  const [duplicateFrom, setDuplicateFrom] = useState<StockEntry | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshEntries = useCallback(async () => {
    const response = await fetch(materialsApi);
    if (response.ok) {
      setEntries(await response.json());
    }
  }, [materialsApi]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleSaved = async () => {
    await refreshEntries();
    setSuccess("Stock cargado correctamente.");
  };

  const openAdd = () => {
    setDuplicateFrom(null);
    setAddOpen(true);
  };

  const openDuplicate = (entry: StockEntry) => {
    setDuplicateFrom(entry);
    setAddOpen(true);
  };

  const closeAdd = () => {
    setAddOpen(false);
    setDuplicateFrom(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header>
        <Link
          href={basePath}
          className="text-sm font-medium text-amber-700 transition hover:text-amber-800 dark:text-amber-400"
        >
          ← Volver al panel
        </Link>
        <p className="mt-4 text-sm font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Administración
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Stock e inversiones
        </h1>
      </header>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Inventario actual
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {entries.length}{" "}
              {entries.length === 1
                ? "registro individual"
                : "registros individuales"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {success && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {success}
              </p>
            )}
            {canWrite && (
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-700 px-4 text-sm font-medium text-white transition hover:bg-amber-800"
              >
                Agregar
              </button>
            )}
          </div>
        </div>

        <StockInventoryTable
          entries={entries}
          onRefresh={refreshEntries}
          canWrite={canWrite}
          onDuplicate={openDuplicate}
        />
      </section>

      {canWrite && (
        <AddStockDialog
          open={addOpen}
          duplicateFrom={duplicateFrom}
          onClose={closeAdd}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
