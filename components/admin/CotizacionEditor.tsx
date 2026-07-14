"use client";

import { useMemo, useState } from "react";
import AddQuoteLineDialog from "@/components/admin/AddQuoteLineDialog";
import MoneyInput from "@/components/admin/MoneyInput";
import QuoteLinesTable from "@/components/admin/QuoteLinesTable";
import { getMaterialesTotal } from "@/components/admin/CotizacionList";
import {
  complementaryMarginPcts,
  complementarySharePcts,
  computeCotizacionPricingBreakdown,
  DEFAULT_COTIZACION_PRICING,
} from "@/lib/cotizador/pricing";
import type { Cotizacion, CotizacionPricing } from "@/lib/cotizador/types";
import { formatPrice } from "@/lib/materials/format";
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
  onPricingChange: (pricing: CotizacionPricing) => void;
  onSave: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  duplicating?: boolean;
  onClose?: () => void;
  inModal?: boolean;
};

function parsePctInput(value: string): number {
  const n = Number(value.replace(/,/g, "."));
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

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
  onPricingChange,
  onSave,
  onDelete,
  onDuplicate,
  duplicating = false,
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
  const pricing = cotizacion.pricing ?? DEFAULT_COTIZACION_PRICING;

  const totalCost = getMaterialesTotal(materiales, productMap);
  const breakdown = useMemo(
    () => computeCotizacionPricingBreakdown(totalCost, pricing),
    [totalCost, pricing],
  );

  const patchPricing = (patch: Partial<CotizacionPricing>) => {
    onPricingChange({ ...pricing, ...patch });
  };

  const setReinversionPct = (value: number) => {
    onPricingChange({
      ...pricing,
      ...complementaryMarginPcts("reinversion", value),
    });
  };

  const setGananciaPct = (value: number) => {
    onPricingChange({
      ...pricing,
      ...complementaryMarginPcts("ganancia", value),
    });
  };

  const setSharePct = (
    changed: "fernando" | "chino" | "flavio",
    value: number,
  ) => {
    onPricingChange({
      ...pricing,
      ...complementarySharePcts(changed, value, pricing),
    });
  };

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
          {onDuplicate && !isDraft && (
            <button
              type="button"
              onClick={onDuplicate}
              disabled={duplicating || saving || deleting}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-amber-300 px-4 text-sm font-medium text-amber-800 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-950/30"
            >
              {duplicating ? "Duplicando..." : "Duplicar"}
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

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
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
          <input
            type="text"
            value={cotizacion.descripcion}
            onChange={(event) => onDescripcionChange(event.target.value)}
            readOnly={!canWrite}
            placeholder="Detalle del producto a cotizar..."
            className={inputClassName}
          />
        </label>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
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

      <div className="mt-6 grid gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:grid-cols-2">
        <p className="text-sm font-medium text-zinc-900 sm:col-span-2 dark:text-zinc-50">
          Precios y márgenes
        </p>
        <label className={`${labelClassName} sm:col-span-2`}>
          Precio costo
          <input
            type="text"
            value={formatPrice(breakdown.precioCosto)}
            readOnly
            tabIndex={-1}
            className={`${inputClassName} cursor-not-allowed bg-zinc-50 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300`}
          />
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            Se completa solo con la suma de los materiales.
          </span>
        </label>
        <label className={labelClassName}>
          Precio mínimo
          <MoneyInput
            value={pricing.precioMinimo}
            onChange={(precioMinimo) => patchPricing({ precioMinimo })}
            readOnly={!canWrite}
            placeholder="0"
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Precio venta
          <MoneyInput
            value={pricing.precioVenta}
            onChange={(precioVenta) => patchPricing({ precioVenta })}
            readOnly={!canWrite}
            placeholder="0"
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          % Reinversión
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={pricing.reinversionPct || ""}
            onChange={(event) =>
              setReinversionPct(parsePctInput(event.target.value))
            }
            readOnly={!canWrite}
            placeholder="0"
            className={inputClassName}
          />
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            Con % ganancia suma 100%.
          </span>
        </label>
        <label className={labelClassName}>
          % Ganancia
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={pricing.gananciaPct || ""}
            onChange={(event) =>
              setGananciaPct(parsePctInput(event.target.value))
            }
            readOnly={!canWrite}
            placeholder="0"
            className={inputClassName}
          />
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            Se completa con el complemento de reinversión.
          </span>
        </label>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <p className="text-xs text-zinc-500 sm:col-span-3 dark:text-zinc-400">
          % Fernando + Chino + Flavio = 100%. Al completar uno se ajusta el resto.
        </p>
        <label className={labelClassName}>
          % Ganancia Fernando
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={pricing.gananciaFernandoPct || ""}
            onChange={(event) =>
              setSharePct("fernando", parsePctInput(event.target.value))
            }
            readOnly={!canWrite}
            placeholder="0"
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          % Ganancia Chino
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={pricing.gananciaChinoPct || ""}
            onChange={(event) =>
              setSharePct("chino", parsePctInput(event.target.value))
            }
            readOnly={!canWrite}
            placeholder="0"
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          % Ganancia Flavio
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={pricing.gananciaFlavioPct || ""}
            onChange={(event) =>
              setSharePct("flavio", parsePctInput(event.target.value))
            }
            readOnly={!canWrite}
            placeholder="0"
            className={inputClassName}
          />
        </label>
      </div>

      <div className="mt-6 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Resumen de precios
        </p>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900/50">
            <dt className="text-zinc-600 dark:text-zinc-400">Precio costo</dt>
            <dd className="tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
              {formatPrice(breakdown.precioCosto)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900/50">
            <dt className="text-zinc-600 dark:text-zinc-400">Precio mínimo</dt>
            <dd className="tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
              {formatPrice(breakdown.precioMinimo)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900/50">
            <dt className="text-zinc-600 dark:text-zinc-400">Precio venta</dt>
            <dd className="tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
              {formatPrice(breakdown.precioVenta)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900/50">
            <dt className="text-zinc-600 dark:text-zinc-400">
              Reinversión ({pricing.reinversionPct}%)
            </dt>
            <dd className="tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
              {formatPrice(breakdown.reinversionMonto)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900/50 sm:col-span-2">
            <dt className="text-zinc-600 dark:text-zinc-400">
              Ganancia ({pricing.gananciaPct}%)
            </dt>
            <dd className="tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
              {formatPrice(breakdown.gananciaMonto)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/20">
            <dt className="text-zinc-700 dark:text-zinc-300">
              Fernando ({pricing.gananciaFernandoPct}%)
            </dt>
            <dd className="tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
              {formatPrice(breakdown.gananciaFernando)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/20">
            <dt className="text-zinc-700 dark:text-zinc-300">
              Chino ({pricing.gananciaChinoPct}%)
            </dt>
            <dd className="tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
              {formatPrice(breakdown.gananciaChino)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/60 px-3 py-2 dark:border-amber-900/40 dark:bg-amber-950/20 sm:col-span-2">
            <dt className="text-zinc-700 dark:text-zinc-300">
              Flavio ({pricing.gananciaFlavioPct}%)
            </dt>
            <dd className="tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
              {formatPrice(breakdown.gananciaFlavio)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Reinversión y ganancia se calculan sobre (precio venta − precio
          costo). El reparto entre Fernando, Chino y Flavio se aplica sobre el
          monto de ganancia.
        </p>
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
