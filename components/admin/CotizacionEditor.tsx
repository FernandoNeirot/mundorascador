"use client";

import { useMemo, useState } from "react";
import AddQuoteLineDialog from "@/components/admin/AddQuoteLineDialog";
import QuoteLinesTable from "@/components/admin/QuoteLinesTable";
import { getMaterialesTotal } from "@/components/admin/CotizacionList";
import { formatPrice } from "@/lib/materials/format";
import type { Cotizacion } from "@/lib/cotizador/types";
import {
  findPairedLine,
  type CommittedQuoteLine,
} from "@/lib/materials/quote-line";
import type { QuoteProductOption } from "@/lib/materials/quote-products";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300";

type CotizacionEditorProps = {
  cotizacion: Cotizacion;
  products: QuoteProductOption[];
  productMap: Map<string, QuoteProductOption>;
  canWrite: boolean;
  dirty: boolean;
  saving: boolean;
  deleting: boolean;
  isDraft?: boolean;
  viewOnlyNote?: string;
  error: string | null;
  onNombreChange: (nombre: string) => void;
  onDescripcionChange: (descripcion: string) => void;
  onMaterialesChange: (materiales: CommittedQuoteLine[]) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose?: () => void;
  inModal?: boolean;
};

export default function CotizacionEditor({
  cotizacion,
  products,
  productMap,
  canWrite,
  dirty,
  saving,
  deleting,
  isDraft = false,
  viewOnlyNote,
  error,
  onNombreChange,
  onDescripcionChange,
  onMaterialesChange,
  onSave,
  onDelete,
  onClose,
  inModal = false,
}: CotizacionEditorProps) {
  const telaProducts = useMemo(
    () => products.filter((p) => p.materialType === "telas"),
    [products],
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [lineToEdit, setLineToEdit] = useState<CommittedQuoteLine | null>(null);
  const [pairedFabricLine, setPairedFabricLine] =
    useState<CommittedQuoteLine | null>(null);

  const materiales = cotizacion.materiales;

  const totalCost = getMaterialesTotal(materiales, productMap);

  const removeLinesFromQuote = (ids: Set<string>) => {
    onMaterialesChange(materiales.filter((line) => !ids.has(line.id)));
  };

  const openAddModal = () => {
    setLineToEdit(null);
    setPairedFabricLine(null);
    setModalOpen(true);
  };

  const openEditModal = (line: CommittedQuoteLine) => {
    const paired = findPairedLine(line, materiales);
    const product = productMap.get(line.productKey);
    const pairedProduct = paired ? productMap.get(paired.productKey) : undefined;

    const isWoodLine = product?.materialType === "maderas";
    const isFabricOfWood =
      paired &&
      pairedProduct?.materialType === "maderas" &&
      product?.materialType === "telas";

    const woodLine = isWoodLine ? line : isFabricOfWood ? paired! : line;
    const fabricLine =
      isWoodLine && paired?.pairRole === "tela"
        ? paired
        : isFabricOfWood
          ? line
          : null;

    const idsToRemove = new Set<string>([line.id]);
    if (paired) idsToRemove.add(paired.id);

    setLineToEdit(woodLine);
    setPairedFabricLine(fabricLine);
    removeLinesFromQuote(idsToRemove);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (lineToEdit) {
      const restore: CommittedQuoteLine[] = [lineToEdit];
      if (pairedFabricLine) restore.push(pairedFabricLine);
      onMaterialesChange([...materiales, ...restore]);
    }
    setModalOpen(false);
    setLineToEdit(null);
    setPairedFabricLine(null);
  };

  const handleCommit = (lines: CommittedQuoteLine[]) => {
    onMaterialesChange([...materiales, ...lines]);
    setModalOpen(false);
    setLineToEdit(null);
    setPairedFabricLine(null);
  };

  const removeMaterial = (id: string) => {
    const target = materiales.find((line) => line.id === id);
    if (target?.pairId) {
      onMaterialesChange(
        materiales.filter((line) => line.pairId !== target.pairId),
      );
      return;
    }
    onMaterialesChange(materiales.filter((line) => line.id !== id));
  };

  return (
    <section
      className={
        inModal
          ? "min-w-0"
          : "min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950"
      }
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Producto cotizado
          </h2>
          {dirty && canWrite && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              {isDraft ? "Sin guardar en Firebase" : "Cambios sin guardar"}
            </p>
          )}
          {viewOnlyNote && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {viewOnlyNote}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Cerrar
            </button>
          )}
          {canWrite && (
            <>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting || saving}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-red-300 px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                {deleting ? "Eliminando..." : isDraft ? "Descartar" : "Eliminar"}
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={(!dirty && !isDraft) || saving || deleting}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-700 px-4 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Guardando..." : isDraft ? "Crear cotización" : "Guardar"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mb-6 grid gap-4">
        <label className={labelClassName}>
          Nombre
          <input
            type="text"
            value={cotizacion.nombre}
            onChange={(event) => onNombreChange(event.target.value)}
            readOnly={!canWrite}
            placeholder="Ej. Sillón modular"
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Descripción
          <textarea
            value={cotizacion.descripcion}
            onChange={(event) => onDescripcionChange(event.target.value)}
            readOnly={!canWrite}
            rows={3}
            placeholder="Detalle del producto a cotizar..."
            className={`${inputClassName} min-h-[96px] resize-y`}
          />
        </label>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Materiales
          {materiales.length > 0 && (
            <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
              ({materiales.length})
            </span>
          )}
        </p>
        {canWrite && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-700 px-4 text-sm font-medium text-white transition hover:bg-amber-800"
          >
            Agregar material
          </button>
        )}
      </div>

      <QuoteLinesTable
        lines={materiales}
        productMap={productMap}
        onEdit={openEditModal}
        onDelete={removeMaterial}
        readOnly={!canWrite}
      />

      <div className="mt-6 flex justify-end border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <div className="text-right">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Costo total</p>
          <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatPrice(totalCost)}
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {canWrite && (
        <AddQuoteLineDialog
          open={modalOpen}
          lineToEdit={lineToEdit}
          pairedFabricLine={pairedFabricLine}
          products={products}
          telaProducts={telaProducts}
          productMap={productMap}
          onClose={closeModal}
          onCommit={handleCommit}
        />
      )}
    </section>
  );
}
