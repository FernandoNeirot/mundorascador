"use client";

import { useEffect, useState } from "react";
import {
  BUYER_CONFIG,
  BUYER_TYPES,
  EDITABLE_MATERIAL_TYPES,
  isFabricLikeType,
  isMeterBasedType,
  MATERIAL_CONFIG,
  WOOD_TYPE_CONFIG,
  WOOD_TYPES,
} from "@/lib/materials/constants";
import {
  formatQuantityFromLength,
  isValidLengthCm,
  quantityFromLengthCm,
} from "@/lib/materials/meter-based";
import {
  getRemainingCm2,
  getUsedCm2,
  isStockEntryWithCortes,
  supportsCortesTracking,
} from "@/lib/materials/cortes";
import { formatSuperficieCm2, formatSuperficieCm2Preview } from "@/lib/materials/superficie";
import type {
  BuyerType,
  MaterialType,
  StockEntry,
  StockEntryWithCortes,
  WoodType,
} from "@/lib/materials/types";
import CortesStockDialog from "@/components/admin/CortesStockDialog";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300";

const readOnlyInputClassName = `${inputClassName} cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/60`;

type EditStockDialogProps = {
  entry: StockEntry | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function EditStockDialog({
  entry,
  onClose,
  onSaved,
}: EditStockDialogProps) {
  const [editType, setEditType] = useState<MaterialType>("telas");
  const [compradoPor, setCompradoPor] = useState<BuyerType>("fernando");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [anchoCm, setAnchoCm] = useState("");
  const [largoCm, setLargoCm] = useState("");
  const [color, setColor] = useState("");
  const [tipoMadera, setTipoMadera] = useState<WoodType>("pino");
  const [anchoMm, setAnchoMm] = useState("");
  const [cantidadUsada, setCantidadUsada] = useState("");
  const [cortesOpen, setCortesOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entry) return;

    setEditType(entry.type);
    setCompradoPor(entry.compradoPor);
    setPrice(String(entry.price));
    setError(null);
    setDescripcion("");
    setAnchoCm("");
    setLargoCm("");
    setColor("");
    setAnchoMm("");
    setTipoMadera("pino");
    setCantidadUsada("0");

    switch (entry.type) {
      case "telas":
      case "guata":
        setDescripcion(entry.descripcion);
        setAnchoCm(String(entry.anchoCm));
        setLargoCm(String(entry.largoCm));
        setColor(entry.color);
        setQuantity(formatQuantityFromLength(String(entry.largoCm)));
        break;
      case "hilo":
        setDescripcion(entry.descripcion);
        setLargoCm(String(entry.largoCm));
        setQuantity(formatQuantityFromLength(String(entry.largoCm)));
        break;
      case "maderas":
        setAnchoCm(String(entry.anchoCm));
        setLargoCm(String(entry.largoCm));
        setTipoMadera(entry.tipoMadera);
        setQuantity(String(entry.quantity));
        break;
      case "cano_pvc":
        setAnchoMm(String(entry.anchoMm));
        setLargoCm(String(entry.largoCm));
        setQuantity(formatQuantityFromLength(String(entry.largoCm)));
        break;
      case "herramientas":
        setDescripcion(entry.descripcion);
        setQuantity(String(entry.quantity));
        break;
    }

    setCantidadUsada(String(entry.cantidadUsada ?? 0));
  }, [entry]);

  useEffect(() => {
    if (isMeterBasedType(editType)) {
      setQuantity(formatQuantityFromLength(largoCm));
    }
  }, [editType, largoCm]);

  if (!entry) return null;

  const parseField = (value: string, label: string): number | null => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(`${label} debe ser un número mayor a 0.`);
      return null;
    }
    return parsed;
  };

  const parseLengthField = (value: string, label: string): number | null => {
    const parsed = Number(value);
    if (!isValidLengthCm(parsed)) {
      setError(`${label} debe ser un número mayor a 100 cm.`);
      return null;
    }
    return parsed;
  };

  const parseCantidadUsadaField = (
    value: string,
    maxQuantity: number,
  ): number | null => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("La cantidad usada debe ser 0 o mayor.");
      return null;
    }
    if (parsed > maxQuantity) {
      setError("La cantidad usada no puede superar la cantidad en stock.");
      return null;
    }
    return parsed;
  };

  const handleLargoChange = (value: string) => {
    setLargoCm(value);
  };

  const handleTypeChange = (newType: MaterialType) => {
    const wasMeterBased = isMeterBasedType(editType);
    setEditType(newType);
    setError(null);
    if (isMeterBasedType(newType)) {
      setQuantity(formatQuantityFromLength(largoCm));
    } else if (wasMeterBased) {
      setQuantity("1");
    }
  };

  const resolveQuantity = (): number | null => {
    if (isMeterBasedType(editType)) {
      const parsedLargo = parseLengthField(largoCm, "El largo");
      if (parsedLargo === null) return null;
      return quantityFromLengthCm(parsedLargo);
    }
    return parseField(quantity, "La cantidad");
  };

  const buildPayload = (): Record<string, unknown> | null => {
    const parsedPrice = parseField(price, "El precio");
    if (parsedPrice === null) return null;
    const parsedQuantity = resolveQuantity();
    if (parsedQuantity === null) return null;

    let parsedCantidadUsada: number | undefined;
    let cortes: StockEntryWithCortes["cortes"] | undefined;

    if (supportsCortesTracking(editType)) {
      if (entry.type !== editType) {
        setError("El tipo de registro no coincide.");
        return null;
      }
      cortes = entry.cortes ?? [];
    } else {
      const used = parseCantidadUsadaField(cantidadUsada, parsedQuantity);
      if (used === null) return null;
      parsedCantidadUsada = used;
    }

    const base = {
      type: editType,
      price: parsedPrice,
      quantity: parsedQuantity,
      compradoPor,
      ...(parsedCantidadUsada !== undefined && {
        cantidadUsada: parsedCantidadUsada,
      }),
      ...(cortes !== undefined && { cortes }),
    };

    switch (editType) {
      case "telas":
        if (!descripcion.trim()) {
          setError("Ingresá la descripción de la tela.");
          return null;
        }
        if (!color.trim()) {
          setError("Ingresá el color de la tela.");
          return null;
        }
        {
          const parsedAncho = parseField(anchoCm, "El ancho");
          if (parsedAncho === null) return null;
          const parsedLargo = parseLengthField(largoCm, "El largo");
          if (parsedLargo === null) return null;
          return {
            ...base,
            type: "telas",
            descripcion: descripcion.trim(),
            color: color.trim(),
            anchoCm: parsedAncho,
            largoCm: parsedLargo,
          };
        }
      case "guata":
        if (!descripcion.trim()) {
          setError("Ingresá la descripción de la guata.");
          return null;
        }
        if (!color.trim()) {
          setError("Ingresá el color de la guata.");
          return null;
        }
        {
          const parsedAncho = parseField(anchoCm, "El ancho");
          if (parsedAncho === null) return null;
          const parsedLargo = parseLengthField(largoCm, "El largo");
          if (parsedLargo === null) return null;
          return {
            ...base,
            type: "guata",
            descripcion: descripcion.trim(),
            color: color.trim(),
            anchoCm: parsedAncho,
            largoCm: parsedLargo,
          };
        }
      case "hilo": {
        if (!descripcion.trim()) {
          setError("Ingresá la descripción del hilo.");
          return null;
        }
        const parsedLargo = parseLengthField(largoCm, "El largo");
        if (parsedLargo === null) return null;
        return {
          ...base,
          descripcion: descripcion.trim(),
          largoCm: parsedLargo,
        };
      }
      case "maderas": {
        const parsedAncho = parseField(anchoCm, "El ancho");
        if (parsedAncho === null) return null;
        const parsedLargo = parseField(largoCm, "El largo");
        if (parsedLargo === null) return null;
        return {
          ...base,
          anchoCm: parsedAncho,
          largoCm: parsedLargo,
          tipoMadera,
        };
      }
      case "cano_pvc": {
        const parsedAncho = parseField(anchoMm, "El ancho");
        if (parsedAncho === null) return null;
        const parsedLargo = parseLengthField(largoCm, "El largo");
        if (parsedLargo === null) return null;
        return {
          ...base,
          anchoMm: parsedAncho,
          largoCm: parsedLargo,
        };
      }
      case "herramientas":
        if (!descripcion.trim()) {
          setError("Ingresá la descripción.");
          return null;
        }
        return { ...base, descripcion: descripcion.trim() };
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const payload = buildPayload();
    if (!payload) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/materials/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "No se pudo actualizar el registro.");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const quantityIsReadOnly = isMeterBasedType(editType);

  const quantityLabel = isMeterBasedType(editType)
    ? "Cantidad (metros)"
    : "Cantidad";

  const priceLabel =
    editType === "maderas"
      ? "Precio por cantidad cargada"
      : isMeterBasedType(editType)
        ? "Precio por metro"
        : "Precio por unidad";

  const parsedQuantityPreview = Number(quantity);
  const parsedUsedPreview = Number(cantidadUsada);

  const cortesPreviewEntry = ((): StockEntryWithCortes | null => {
    if (!supportsCortesTracking(editType) || entry.type !== editType) {
      return null;
    }
    const ancho = Number(anchoCm);
    const largo = Number(largoCm);
    if (
      !Number.isFinite(ancho) ||
      ancho <= 0 ||
      !Number.isFinite(largo) ||
      largo <= 0
    ) {
      return entry;
    }
    const superficieCm2 = ancho * largo;
    if (entry.type === "telas") {
      return { ...entry, anchoCm: ancho, largoCm: largo, superficieCm2 };
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return entry;
    }
    return {
      ...entry,
      quantity: qty,
      anchoCm: ancho,
      largoCm: largo,
      superficieCm2,
    };
  })();

  const remainingPreview =
    cortesPreviewEntry
      ? getRemainingCm2(cortesPreviewEntry)
      : Number.isFinite(parsedQuantityPreview) &&
          Number.isFinite(parsedUsedPreview)
        ? Math.max(0, parsedQuantityPreview - parsedUsedPreview)
        : null;

  const usedQuantityLabel = supportsCortesTracking(editType)
    ? "Superficie usada (cm²)"
    : isMeterBasedType(editType)
      ? "Cantidad usada (metros)"
      : "Cantidad usada";

  const cortesEntry = isStockEntryWithCortes(entry) ? entry : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Editar registro
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Modificá los datos de esta compra individual.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
          >
            Cerrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className={labelClassName}>
            Tipo de material
            <select
              value={editType}
              onChange={(event) =>
                handleTypeChange(event.target.value as MaterialType)
              }
              className={inputClassName}
            >
              {EDITABLE_MATERIAL_TYPES.map((materialType) => (
                <option key={materialType} value={materialType}>
                  {MATERIAL_CONFIG[materialType].label}
                </option>
              ))}
            </select>
          </label>

          <label className={labelClassName}>
            Quién compró
            <select
              value={compradoPor}
              onChange={(event) =>
                setCompradoPor(event.target.value as BuyerType)
              }
              className={inputClassName}
            >
              {BUYER_TYPES.map((buyer) => (
                <option key={buyer} value={buyer}>
                  {BUYER_CONFIG[buyer].label}
                </option>
              ))}
            </select>
          </label>

          {isFabricLikeType(editType) && (
            <>
              <label className={labelClassName}>
                Descripción
                <input
                  type="text"
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClassName}>
                  Ancho (cm)
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={anchoCm}
                    onChange={(event) => setAnchoCm(event.target.value)}
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Largo (cm)
                  <input
                    type="number"
                    min="101"
                    step="any"
                    value={largoCm}
                    onChange={(event) => handleLargoChange(event.target.value)}
                    className={inputClassName}
                  />
                </label>
                {editType === "telas" && (
                  <label className={labelClassName}>
                    Superficie del rollo (cm²)
                    <input
                      type="text"
                      readOnly
                      value={formatSuperficieCm2Preview(anchoCm, largoCm)}
                      placeholder="Se calcula del ancho y largo"
                      className={readOnlyInputClassName}
                    />
                  </label>
                )}
              </div>
              <label className={labelClassName}>
                Color
                <input
                  type="text"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className={inputClassName}
                />
              </label>
            </>
          )}

          {editType === "hilo" && (
            <>
              <label className={labelClassName}>
                Descripción
                <input
                  type="text"
                  value={descripcion}
                  onChange={(event) => setDescripcion(event.target.value)}
                  placeholder="Ej: Yute, Sisal"
                  className={inputClassName}
                />
              </label>
              <label className={labelClassName}>
                Largo (cm)
                <input
                  type="number"
                  min="101"
                  step="any"
                  value={largoCm}
                  onChange={(event) => handleLargoChange(event.target.value)}
                  className={inputClassName}
                />
              </label>
            </>
          )}

          {editType === "maderas" && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClassName}>
                  Ancho (cm)
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={anchoCm}
                    onChange={(event) => setAnchoCm(event.target.value)}
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Largo (cm)
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={largoCm}
                    onChange={(event) => setLargoCm(event.target.value)}
                    className={inputClassName}
                  />
                </label>
                <label className={labelClassName}>
                  Superficie (cm²)
                  <input
                    type="text"
                    readOnly
                    value={formatSuperficieCm2Preview(anchoCm, largoCm)}
                    placeholder="Se calcula del ancho y largo"
                    className={readOnlyInputClassName}
                  />
                </label>
              </div>
              <label className={labelClassName}>
                Tipo de madera
                <select
                  value={tipoMadera}
                  onChange={(event) =>
                    setTipoMadera(event.target.value as WoodType)
                  }
                  className={inputClassName}
                >
                  {WOOD_TYPES.map((woodType) => (
                    <option key={woodType} value={woodType}>
                      {WOOD_TYPE_CONFIG[woodType].label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {editType === "cano_pvc" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClassName}>
                Ancho (mm)
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={anchoMm}
                  onChange={(event) => setAnchoMm(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className={labelClassName}>
                Largo (cm)
                <input
                  type="number"
                  min="101"
                  step="any"
                  value={largoCm}
                  onChange={(event) => handleLargoChange(event.target.value)}
                  className={inputClassName}
                />
              </label>
            </div>
          )}

          {editType === "herramientas" && (
            <label className={labelClassName}>
              Descripción
              <input
                type="text"
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                className={inputClassName}
              />
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClassName}>
              {quantityLabel}
              <input
                type={quantityIsReadOnly ? "text" : "number"}
                readOnly={quantityIsReadOnly}
                min={quantityIsReadOnly ? undefined : "1"}
                step={quantityIsReadOnly ? undefined : "1"}
                value={quantity}
                onChange={
                  quantityIsReadOnly
                    ? undefined
                    : (event) => setQuantity(event.target.value)
                }
                placeholder={
                  isMeterBasedType(editType) ? "Se calcula del largo" : undefined
                }
                className={
                  quantityIsReadOnly ? readOnlyInputClassName : inputClassName
                }
              />
              {isMeterBasedType(editType) && (
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  Largo ÷ 100 (1 metro = 100 cm).
                </span>
              )}
            </label>
            <label className={labelClassName}>
              {priceLabel}
              <input
                type="number"
                min="0.01"
                step="any"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className={inputClassName}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {cortesEntry && supportsCortesTracking(editType) ? (
              <label className={labelClassName}>
                {usedQuantityLabel}
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={formatSuperficieCm2(getUsedCm2(cortesEntry))}
                    className={`${readOnlyInputClassName} min-w-0 flex-1`}
                  />
                  <button
                    type="button"
                    onClick={() => setCortesOpen(true)}
                    className="shrink-0 rounded-lg border border-amber-600/40 px-3 text-sm font-medium text-amber-800 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
                  >
                    Cortes
                  </button>
                </div>
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  {(cortesEntry.cortes?.length ?? 0) === 0
                    ? "Sin cortes cargados"
                    : `${cortesEntry.cortes.length} corte${cortesEntry.cortes.length === 1 ? "" : "s"}`}
                </span>
              </label>
            ) : (
              <label className={labelClassName}>
                {usedQuantityLabel}
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={cantidadUsada}
                  onChange={(event) => setCantidadUsada(event.target.value)}
                  className={inputClassName}
                />
              </label>
            )}
            <label className={labelClassName}>
              Stock restante
              {supportsCortesTracking(editType) ? " (cm²)" : ""}
              <input
                type="text"
                readOnly
                value={
                  remainingPreview === null
                    ? "—"
                    : supportsCortesTracking(editType)
                      ? formatSuperficieCm2(remainingPreview)
                      : remainingPreview.toLocaleString("es-AR")
                }
                className={readOnlyInputClassName}
              />
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-700 px-4 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>

      {cortesEntry && (
        <CortesStockDialog
          entry={cortesEntry}
          open={cortesOpen}
          onClose={() => setCortesOpen(false)}
          onSaved={() => {
            onSaved();
            setCortesOpen(false);
          }}
        />
      )}
    </div>
  );
}
