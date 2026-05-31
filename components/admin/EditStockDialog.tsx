"use client";

import { useEffect, useState } from "react";
import {
  BUYER_CONFIG,
  BUYER_TYPES,
  isFabricLikeEntry,
  WOOD_TYPE_CONFIG,
  WOOD_TYPES,
} from "@/lib/materials/constants";
import type { BuyerType, StockEntry, WoodType } from "@/lib/materials/types";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300";

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
  const [compradoPor, setCompradoPor] = useState<BuyerType>("fernando");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [marca, setMarca] = useState("");
  const [anchoCm, setAnchoCm] = useState("");
  const [largoCm, setLargoCm] = useState("");
  const [color, setColor] = useState("");
  const [tipoMadera, setTipoMadera] = useState<WoodType>("pino");
  const [anchoMm, setAnchoMm] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entry) return;

    setCompradoPor(entry.compradoPor);
    setQuantity(String(entry.quantity));
    setPrice(String(entry.price));
    setError(null);

    switch (entry.type) {
      case "telas":
      case "guata":
        setMarca(entry.marca);
        setAnchoCm(String(entry.anchoCm));
        setLargoCm(String(entry.largoCm));
        setColor(entry.color);
        break;
      case "maderas":
        setAnchoCm(String(entry.anchoCm));
        setLargoCm(String(entry.largoCm));
        setTipoMadera(entry.tipoMadera);
        break;
      case "cano_pvc":
        setAnchoMm(String(entry.anchoMm));
        setLargoCm(String(entry.largoCm));
        break;
      case "herramientas":
        setDescripcion(entry.descripcion);
        break;
    }
  }, [entry]);

  if (!entry) return null;

  const parseField = (value: string, label: string): number | null => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(`${label} debe ser un número mayor a 0.`);
      return null;
    }
    return parsed;
  };

  const buildPayload = (): Record<string, unknown> | null => {
    const parsedQuantity = parseField(quantity, "La cantidad");
    if (parsedQuantity === null) return null;
    const parsedPrice = parseField(price, "El precio");
    if (parsedPrice === null) return null;

    const base = {
      type: entry.type,
      quantity: parsedQuantity,
      price: parsedPrice,
      compradoPor,
    };

    switch (entry.type) {
      case "telas":
      case "guata":
        if (!marca.trim()) {
          setError(`Ingresá la marca de la ${entry.type === "guata" ? "guata" : "tela"}.`);
          return null;
        }
        if (!color.trim()) {
          setError(`Ingresá el color de la ${entry.type === "guata" ? "guata" : "tela"}.`);
          return null;
        }
        {
          const parsedAncho = parseField(anchoCm, "El ancho");
          if (parsedAncho === null) return null;
          const parsedLargo = parseField(largoCm, "El largo");
          if (parsedLargo === null) return null;
          return {
            ...base,
            type: entry.type,
            marca: marca.trim(),
            color: color.trim(),
            anchoCm: parsedAncho,
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
        const parsedLargo = parseField(largoCm, "El largo");
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

          {isFabricLikeEntry(entry) && (
            <>
              <label className={labelClassName}>
                Marca
                <input
                  type="text"
                  value={marca}
                  onChange={(event) => setMarca(event.target.value)}
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
                    min="0.01"
                    step="any"
                    value={largoCm}
                    onChange={(event) => setLargoCm(event.target.value)}
                    className={inputClassName}
                  />
                </label>
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

          {entry.type === "maderas" && (
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

          {entry.type === "cano_pvc" && (
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
                  min="0.01"
                  step="any"
                  value={largoCm}
                  onChange={(event) => setLargoCm(event.target.value)}
                  className={inputClassName}
                />
              </label>
            </div>
          )}

          {entry.type === "herramientas" && (
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
              Cantidad
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              {isFabricLikeEntry(entry) ? "Precio por metro" : "Precio por unidad"}
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
    </div>
  );
}
