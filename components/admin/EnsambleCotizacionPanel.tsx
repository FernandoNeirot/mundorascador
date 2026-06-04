"use client";

import { useMemo, useState } from "react";
import AddQuoteLineDialog from "@/components/admin/AddQuoteLineDialog";
import QuoteLinesTable from "@/components/admin/QuoteLinesTable";
import { getMaterialesTotal } from "@/components/admin/CotizacionList";
import { formatPrice } from "@/lib/materials/format";
import {
  findPairedLine,
  type CommittedQuoteLine,
} from "@/lib/materials/quote-line";
import type { QuoteProductOption } from "@/lib/materials/quote-products";
import type { RascadorEnsambleConfig } from "@/lib/ensamble/cat-scratcher";
import { DEFAULT_ENSAMBLE_COTIZACION_PREFS } from "@/lib/ensamble/cotizacion-prefs";
import {
  mergePiezasQuoteLines,
  piezasToQuoteLines,
} from "@/lib/ensamble/piezas-to-quote-lines";
import type { EnsambleCotizacionPrefs } from "@/lib/ensamble/types";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300";

const selectClassName = `${inputClassName} w-full min-w-0`;

type EnsambleCotizacionPanelProps = {
  config: RascadorEnsambleConfig;
  descripcion: string;
  materiales: CommittedQuoteLine[];
  cotizacionPrefs: EnsambleCotizacionPrefs;
  products: QuoteProductOption[];
  productMap: Map<string, QuoteProductOption>;
  canEdit: boolean;
  onDescripcionChange: (value: string) => void;
  onMaterialesChange: (lines: CommittedQuoteLine[]) => void;
  onPrefsChange: (prefs: EnsambleCotizacionPrefs) => void;
};

export default function EnsambleCotizacionPanel({
  config,
  descripcion,
  materiales,
  cotizacionPrefs,
  products,
  productMap,
  canEdit,
  onDescripcionChange,
  onMaterialesChange,
  onPrefsChange,
}: EnsambleCotizacionPanelProps) {
  const prefs = cotizacionPrefs ?? DEFAULT_ENSAMBLE_COTIZACION_PREFS;
  const maderaProducts = useMemo(
    () => products.filter((p) => p.materialType === "maderas"),
    [products],
  );
  const telaProducts = useMemo(
    () => products.filter((p) => p.materialType === "telas"),
    [products],
  );
  const hiloProducts = useMemo(
    () => products.filter((p) => p.materialType === "hilo"),
    [products],
  );
  const herramientasProducts = useMemo(
    () => products.filter((p) => p.materialType === "herramientas"),
    [products],
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [lineToEdit, setLineToEdit] = useState<CommittedQuoteLine | null>(null);
  const [pairedFabricLine, setPairedFabricLine] =
    useState<CommittedQuoteLine | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const totalCost = getMaterialesTotal(materiales, productMap);

  const updatePrefs = (patch: Partial<EnsambleCotizacionPrefs>) => {
    onPrefsChange({ ...prefs, ...patch });
  };

  const handleImportFromPiezas = () => {
    setImportError(null);
    if (!prefs.maderaProductKey.trim()) {
      setImportError("Elegí un producto de madera para importar las piezas.");
      return;
    }
    const generated = piezasToQuoteLines(config, prefs);
    onMaterialesChange(mergePiezasQuoteLines(materiales, generated));
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
    onMaterialesChange(materiales.filter((l) => !idsToRemove.has(l.id)));
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
    <section className="flex min-w-0 flex-col gap-6">
      <div>
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Cotización de materiales
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Se guarda junto al diseño en el mismo documento de Firebase (
          <code className="text-xs">taller-ensambles</code>).
        </p>
      </div>

      <label className={labelClassName}>
        Descripción del producto
        <textarea
          value={descripcion}
          onChange={(e) => onDescripcionChange(e.target.value)}
          readOnly={!canEdit}
          rows={3}
          placeholder="Uso, cliente, notas para publicar más adelante..."
          className={`${inputClassName} min-h-[96px] resize-y`}
        />
      </label>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Importar desde piezas del diseño
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Maderas con tela opcional; en columnas podés sumar tela, hilo y
          tornillos según la cantidad de postes.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={labelClassName}>
            Madera (stock)
            <select
              value={prefs.maderaProductKey}
              disabled={!canEdit}
              onChange={(e) =>
                updatePrefs({ maderaProductKey: e.target.value })
              }
              className={selectClassName}
            >
              <option value="">— Elegir —</option>
              {maderaProducts.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClassName}>
            Tela para maderas
            <select
              value={prefs.telaProductKey}
              disabled={!canEdit}
              onChange={(e) => updatePrefs({ telaProductKey: e.target.value })}
              className={selectClassName}
            >
              <option value="">Sin tela</option>
              {telaProducts.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={prefs.aplicarTelaEnMaderas}
            disabled={!canEdit}
            onChange={(e) =>
              updatePrefs({ aplicarTelaEnMaderas: e.target.checked })
            }
            className="rounded border-zinc-300 text-violet-700"
          />
          Emparejar tela en cada pieza de madera
        </label>

        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-800 dark:text-zinc-200">
            <input
              type="checkbox"
              checked={prefs.aplicarExtrasColumnas}
              disabled={!canEdit}
              onChange={(e) =>
                updatePrefs({ aplicarExtrasColumnas: e.target.checked })
              }
              className="rounded border-zinc-300 text-amber-700"
            />
            Extras por columna
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className={labelClassName}>
              Tela columnas
              <select
                value={prefs.columnaTelaProductKey}
                disabled={!canEdit || !prefs.aplicarExtrasColumnas}
                onChange={(e) =>
                  updatePrefs({ columnaTelaProductKey: e.target.value })
                }
                className={selectClassName}
              >
                <option value="">—</option>
                {telaProducts.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Hilo
              <select
                value={prefs.columnaHiloProductKey}
                disabled={!canEdit || !prefs.aplicarExtrasColumnas}
                onChange={(e) =>
                  updatePrefs({ columnaHiloProductKey: e.target.value })
                }
                className={selectClassName}
              >
                <option value="">—</option>
                {hiloProducts.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Metros hilo / columna
              <input
                type="number"
                min="0"
                step="any"
                value={prefs.hiloMetrosPorColumna}
                disabled={!canEdit || !prefs.aplicarExtrasColumnas}
                onChange={(e) =>
                  updatePrefs({ hiloMetrosPorColumna: e.target.value })
                }
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Tornillos (herramientas)
              <select
                value={prefs.columnaTornillosProductKey}
                disabled={!canEdit || !prefs.aplicarExtrasColumnas}
                onChange={(e) =>
                  updatePrefs({ columnaTornillosProductKey: e.target.value })
                }
                className={selectClassName}
              >
                <option value="">—</option>
                {herramientasProducts.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClassName}>
              Tornillos / columna
              <input
                type="number"
                min="0"
                step="1"
                value={prefs.tornillosPorColumna}
                disabled={!canEdit || !prefs.aplicarExtrasColumnas}
                onChange={(e) =>
                  updatePrefs({ tornillosPorColumna: e.target.value })
                }
                className={inputClassName}
              />
            </label>
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={handleImportFromPiezas}
            className="mt-4 text-sm font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400"
          >
            Generar materiales desde piezas
          </button>
        )}
        {importError && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">
            {importError}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Materiales cotizados
          {materiales.length > 0 && (
            <span className="ml-2 font-normal text-zinc-500">
              ({materiales.length})
            </span>
          )}
        </p>
        {canEdit && (
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
        readOnly={!canEdit}
      />

      <div className="flex justify-end border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <div className="text-right">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Costo total</p>
          <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatPrice(totalCost)}
          </p>
        </div>
      </div>

      {canEdit && (
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
