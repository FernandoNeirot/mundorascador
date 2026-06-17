"use client";

import { useEffect, useState } from "react";
import {
  BUYER_CONFIG,
  BUYER_TYPES,
  defaultUsarEnProductos,
  isFabricLikeType,
  MATERIAL_CONFIG,
  MATERIAL_TYPES,
  WOOD_TYPE_CONFIG,
  WOOD_TYPES,
} from "@/lib/materials/constants";
import { formatQuantityFromLength, isValidLengthCm, quantityFromLengthCm } from "@/lib/materials/meter-based";
import { formatSuperficieCm2Preview } from "@/lib/materials/superficie";
import PriceFieldWithCalculator from "@/components/admin/PriceFieldWithCalculator";
import type { BuyerType, MaterialType, StockEntry, WoodType } from "@/lib/materials/types";
import { useTenantPaths } from "@/lib/tenant/context";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300";

const readOnlyInputClassName = `${inputClassName} cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/60`;

const emptyTelaForm = {
  descripcion: "",
  anchoCm: "",
  largoCm: "",
  color: "",
  cantidad: "",
  precio: "",
};

const emptyHiloForm = {
  descripcion: "",
  largoCm: "",
  cantidad: "",
  precio: "",
};

const emptyMaderaForm = {
  descripcion: "",
  anchoCm: "",
  largoCm: "",
  tipoMadera: "pino" as WoodType,
  cantidad: "",
  precio: "",
};

const emptyCanoForm = {
  descripcion: "",
  largoCm: "",
  cantidad: "",
  precio: "",
};

const emptyHerramientaForm = {
  descripcion: "",
  cantidad: "",
  precio: "",
};

function getDuplicateFormState(entry: StockEntry) {
  const price = String(entry.price);
  const compradoPor = entry.compradoPor;
  const usarEnProductos = entry.usarEnProductos;

  switch (entry.type) {
    case "herramientas":
      return {
        esHerramienta: true as const,
        type: "telas" as MaterialType,
        compradoPor,
        usarEnProductos,
        telaForm: emptyTelaForm,
        hiloForm: emptyHiloForm,
        maderaForm: emptyMaderaForm,
        canoForm: emptyCanoForm,
        herramientaForm: {
          descripcion: entry.descripcion,
          cantidad: String(entry.quantity),
          precio: price,
        },
      };
    case "telas":
    case "guata":
      return {
        esHerramienta: false as const,
        type: entry.type,
        compradoPor,
        usarEnProductos,
        telaForm: {
          descripcion: entry.descripcion,
          anchoCm: String(entry.anchoCm),
          largoCm: String(entry.largoCm),
          color: entry.color,
          cantidad: formatQuantityFromLength(String(entry.largoCm)),
          precio: price,
        },
        hiloForm: emptyHiloForm,
        maderaForm: emptyMaderaForm,
        canoForm: emptyCanoForm,
        herramientaForm: emptyHerramientaForm,
      };
    case "hilo":
      return {
        esHerramienta: false as const,
        type: "hilo" as const,
        compradoPor,
        usarEnProductos,
        telaForm: emptyTelaForm,
        hiloForm: {
          descripcion: entry.descripcion,
          largoCm: String(entry.largoCm),
          cantidad: formatQuantityFromLength(String(entry.largoCm)),
          precio: price,
        },
        maderaForm: emptyMaderaForm,
        canoForm: emptyCanoForm,
        herramientaForm: emptyHerramientaForm,
      };
    case "maderas":
      return {
        esHerramienta: false as const,
        type: "maderas" as const,
        compradoPor,
        usarEnProductos,
        telaForm: emptyTelaForm,
        hiloForm: emptyHiloForm,
        maderaForm: {
          descripcion: entry.descripcion,
          anchoCm: String(entry.anchoCm),
          largoCm: String(entry.largoCm),
          tipoMadera: entry.tipoMadera,
          cantidad: String(entry.quantity),
          precio: price,
        },
        canoForm: emptyCanoForm,
        herramientaForm: emptyHerramientaForm,
      };
    case "cano":
      return {
        esHerramienta: false as const,
        type: "cano" as const,
        compradoPor,
        usarEnProductos,
        telaForm: emptyTelaForm,
        hiloForm: emptyHiloForm,
        maderaForm: emptyMaderaForm,
        canoForm: {
          descripcion: entry.descripcion,
          largoCm: String(entry.largoCm),
          cantidad: String(entry.largoCm),
          precio: price,
        },
        herramientaForm: emptyHerramientaForm,
      };
  }
}

type AddStockDialogProps = {
  open: boolean;
  duplicateFrom?: StockEntry | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function AddStockDialog({
  open,
  duplicateFrom = null,
  onClose,
  onSaved,
}: AddStockDialogProps) {
  const { materialsApi } = useTenantPaths();
  const [esHerramienta, setEsHerramienta] = useState(false);
  const [type, setType] = useState<MaterialType>("telas");
  const [compradoPor, setCompradoPor] = useState<BuyerType>("fernando");
  const [usarEnProductos, setUsarEnProductos] = useState(true);
  const [telaForm, setTelaForm] = useState(emptyTelaForm);
  const [hiloForm, setHiloForm] = useState(emptyHiloForm);
  const [maderaForm, setMaderaForm] = useState(emptyMaderaForm);
  const [canoForm, setCanoForm] = useState(emptyCanoForm);
  const [herramientaForm, setHerramientaForm] = useState(emptyHerramientaForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    if (duplicateFrom) {
      const state = getDuplicateFormState(duplicateFrom);
      setEsHerramienta(state.esHerramienta);
      setType(state.type);
      setCompradoPor(state.compradoPor);
      setUsarEnProductos(state.usarEnProductos);
      setTelaForm(state.telaForm);
      setHiloForm(state.hiloForm);
      setMaderaForm(state.maderaForm);
      setCanoForm(state.canoForm);
      setHerramientaForm(state.herramientaForm);
      setError(null);
      return;
    }

    setEsHerramienta(false);
    setType("telas");
    setCompradoPor("fernando");
    setUsarEnProductos(true);
    setTelaForm(emptyTelaForm);
    setHiloForm(emptyHiloForm);
    setMaderaForm(emptyMaderaForm);
    setCanoForm(emptyCanoForm);
    setHerramientaForm(emptyHerramientaForm);
    setError(null);
  }, [open, duplicateFrom]);

  if (!open) return null;

  const parseLengthField = (value: string, label: string): number | null => {
    const parsed = Number(value);
    if (!isValidLengthCm(parsed)) {
      setError(`${label} debe ser un número mayor a 100 cm.`);
      return null;
    }
    return parsed;
  };

  const parseField = (value: string, label: string): number | null => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(`${label} debe ser un número mayor a 0.`);
      return null;
    }
    return parsed;
  };

  const buildPayload = (): Record<string, unknown> | null => {
    if (esHerramienta) {
      if (!herramientaForm.descripcion.trim()) {
        setError("Ingresá la descripción del producto genérico.");
        return null;
      }
      const quantity = parseField(herramientaForm.cantidad, "La cantidad");
      if (quantity === null) return null;
      const price = parseField(herramientaForm.precio, "El precio");
      if (price === null) return null;

      return {
        type: "herramientas",
        descripcion: herramientaForm.descripcion.trim(),
        quantity,
        price,
        compradoPor,
        usarEnProductos,
      };
    }

    if (isFabricLikeType(type)) {
      if (!telaForm.descripcion.trim()) {
        setError(`Ingresá la descripción de la ${type === "guata" ? "guata" : "tela"}.`);
        return null;
      }
      if (!telaForm.color.trim()) {
        setError(`Ingresá el color de la ${type === "guata" ? "guata" : "tela"}.`);
        return null;
      }
      const anchoCm = parseField(telaForm.anchoCm, "El ancho");
      if (anchoCm === null) return null;
      const largoCm = parseLengthField(telaForm.largoCm, "El largo");
      if (largoCm === null) return null;
      const price = parseField(telaForm.precio, "El precio");
      if (price === null) return null;

      return {
        type,
        descripcion: telaForm.descripcion.trim(),
        anchoCm,
        largoCm,
        color: telaForm.color.trim(),
        quantity: quantityFromLengthCm(largoCm),
        price,
        compradoPor,
        usarEnProductos,
      };
    }

    if (type === "hilo") {
      if (!hiloForm.descripcion.trim()) {
        setError("Ingresá la descripción del hilo.");
        return null;
      }
      const largoCm = parseLengthField(hiloForm.largoCm, "El largo");
      if (largoCm === null) return null;
      const price = parseField(hiloForm.precio, "El precio");
      if (price === null) return null;

      return {
        type: "hilo",
        descripcion: hiloForm.descripcion.trim(),
        largoCm,
        quantity: quantityFromLengthCm(largoCm),
        price,
        compradoPor,
        usarEnProductos,
      };
    }

    if (type === "maderas") {
      if (!maderaForm.descripcion.trim()) {
        setError("Ingresá la descripción de la madera.");
        return null;
      }
      const anchoCm = parseField(maderaForm.anchoCm, "El ancho");
      if (anchoCm === null) return null;
      const largoCm = parseField(maderaForm.largoCm, "El largo");
      if (largoCm === null) return null;
      const quantity = parseField(maderaForm.cantidad, "La cantidad");
      if (quantity === null) return null;
      const price = parseField(maderaForm.precio, "El precio");
      if (price === null) return null;

      return {
        type: "maderas",
        descripcion: maderaForm.descripcion.trim(),
        anchoCm,
        largoCm,
        tipoMadera: maderaForm.tipoMadera,
        quantity,
        price,
        compradoPor,
        usarEnProductos,
      };
    }

    if (!canoForm.descripcion.trim()) {
      setError("Ingresá la descripción del caño.");
      return null;
    }
    const largoCm = parseLengthField(canoForm.largoCm, "El largo");
    if (largoCm === null) return null;
    const price = parseField(canoForm.precio, "El precio");
    if (price === null) return null;

    return {
      type: "cano",
      descripcion: canoForm.descripcion.trim(),
      largoCm,
      quantity: largoCm,
      price,
      compradoPor,
      usarEnProductos,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const payload = buildPayload();
    if (!payload) return;

    setLoading(true);
    try {
      const response = await fetch(materialsApi, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "No se pudo guardar el stock.");
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
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {duplicateFrom ? "Duplicar registro" : "Cargar stock"}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {duplicateFrom
                ? "Revisá los datos y guardá un registro nuevo."
                : "Completá los datos del material a agregar."}
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={esHerramienta}
              onChange={(event) => {
                setEsHerramienta(event.target.checked);
                setUsarEnProductos(
                  event.target.checked ? false : defaultUsarEnProductos(type),
                );
                setError(null);
              }}
              className="size-4 rounded border-zinc-300 text-amber-700 focus:ring-amber-600/20"
            />
            Agregar producto genérico
          </label>

          {esHerramienta ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={`${labelClassName} sm:col-span-2`}>
                Descripción
                <input
                  type="text"
                  value={herramientaForm.descripcion}
                  onChange={(event) =>
                    setHerramientaForm({
                      ...herramientaForm,
                      descripcion: event.target.value,
                    })
                  }
                  placeholder="Ej: Tornillos, pegamento, insumos varios"
                  className={inputClassName}
                />
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
              <label className={labelClassName}>
                Cantidad
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={herramientaForm.cantidad}
                  onChange={(event) =>
                    setHerramientaForm({
                      ...herramientaForm,
                      cantidad: event.target.value,
                    })
                  }
                  placeholder="0"
                  className={inputClassName}
                />
              </label>
              <PriceFieldWithCalculator
                label="Precio por unidad"
                value={herramientaForm.precio}
                onChange={(precio) =>
                  setHerramientaForm({ ...herramientaForm, precio })
                }
                unitShort="unidad"
                measureValue={herramientaForm.cantidad}
                measureLabel="Cantidad"
                className={`${labelClassName} sm:col-span-2`}
              />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className={labelClassName}>
                  Tipo de material
                  <select
                    value={type}
                    onChange={(event) => {
                      const newType = event.target.value as MaterialType;
                      setType(newType);
                      setUsarEnProductos(defaultUsarEnProductos(newType));
                      setError(null);
                    }}
                    className={inputClassName}
                  >
                    {MATERIAL_TYPES.map((materialType) => (
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
              </div>

              {isFabricLikeType(type) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClassName}>
                    Descripción
                    <input
                      type="text"
                      value={telaForm.descripcion}
                      onChange={(event) =>
                        setTelaForm({ ...telaForm, descripcion: event.target.value })
                      }
                      placeholder={
                        type === "guata" ? "Ej: Guata premium" : "Ej: Santista"
                      }
                      className={inputClassName}
                    />
                  </label>
                  <label className={labelClassName}>
                    Color
                    <input
                      type="text"
                      value={telaForm.color}
                      onChange={(event) =>
                        setTelaForm({ ...telaForm, color: event.target.value })
                      }
                      placeholder="Ej: Beige, rojo"
                      className={inputClassName}
                    />
                  </label>
                  <label className={labelClassName}>
                    Ancho (cm)
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={telaForm.anchoCm}
                      onChange={(event) =>
                        setTelaForm({ ...telaForm, anchoCm: event.target.value })
                      }
                      placeholder="140"
                      className={inputClassName}
                    />
                  </label>
                  <label className={labelClassName}>
                    Largo (cm)
                    <input
                      type="number"
                      min="101"
                      step="any"
                      value={telaForm.largoCm}
                      onChange={(event) => {
                        const largoCm = event.target.value;
                        setTelaForm({
                          ...telaForm,
                          largoCm,
                          cantidad: formatQuantityFromLength(largoCm),
                        });
                      }}
                      placeholder="200"
                      className={inputClassName}
                    />
                  </label>
                  <label className={labelClassName}>
                    Cantidad (metros)
                    <input
                      type="text"
                      readOnly
                      value={telaForm.cantidad}
                      placeholder="Se calcula del largo"
                      className={readOnlyInputClassName}
                    />
                  </label>
                  <PriceFieldWithCalculator
                    label="Precio por metro"
                    value={telaForm.precio}
                    onChange={(precio) =>
                      setTelaForm({ ...telaForm, precio })
                    }
                    unitShort="metro"
                    measureValue={telaForm.cantidad}
                    measureLabel="Cantidad (metros)"
                  />
                </div>
              )}

              {type === "hilo" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClassName}>
                    Descripción
                    <input
                      type="text"
                      value={hiloForm.descripcion}
                      onChange={(event) =>
                        setHiloForm({ ...hiloForm, descripcion: event.target.value })
                      }
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
                      value={hiloForm.largoCm}
                      onChange={(event) => {
                        const largoCm = event.target.value;
                        setHiloForm({
                          ...hiloForm,
                          largoCm,
                          cantidad: formatQuantityFromLength(largoCm),
                        });
                      }}
                      placeholder="200"
                      className={inputClassName}
                    />
                  </label>
                  <label className={labelClassName}>
                    Cantidad (metros)
                    <input
                      type="text"
                      readOnly
                      value={hiloForm.cantidad}
                      placeholder="Se calcula del largo"
                      className={readOnlyInputClassName}
                    />
                  </label>
                  <PriceFieldWithCalculator
                    label="Precio por metro"
                    value={hiloForm.precio}
                    onChange={(precio) =>
                      setHiloForm({ ...hiloForm, precio })
                    }
                    unitShort="metro"
                    measureValue={hiloForm.cantidad}
                    measureLabel="Cantidad (metros)"
                  />
                </div>
              )}

              {type === "maderas" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={`${labelClassName} sm:col-span-2`}>
                    Descripción
                    <input
                      type="text"
                      value={maderaForm.descripcion}
                      onChange={(event) =>
                        setMaderaForm({
                          ...maderaForm,
                          descripcion: event.target.value,
                        })
                      }
                      placeholder="Ej. Tabla respaldo sillón"
                      className={inputClassName}
                    />
                  </label>
                  <label className={labelClassName}>
                    Ancho (cm)
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={maderaForm.anchoCm}
                      onChange={(event) =>
                        setMaderaForm({ ...maderaForm, anchoCm: event.target.value })
                      }
                      placeholder="20"
                      className={inputClassName}
                    />
                  </label>
                  <label className={labelClassName}>
                    Largo (cm)
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={maderaForm.largoCm}
                      onChange={(event) =>
                        setMaderaForm({ ...maderaForm, largoCm: event.target.value })
                      }
                      placeholder="250"
                      className={inputClassName}
                    />
                  </label>
                  <label className={labelClassName}>
                    Tipo de madera
                    <select
                      value={maderaForm.tipoMadera}
                      onChange={(event) =>
                        setMaderaForm({
                          ...maderaForm,
                          tipoMadera: event.target.value as WoodType,
                        })
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
                  <label className={labelClassName}>
                    Superficie (cm²)
                    <input
                      type="text"
                      readOnly
                      value={formatSuperficieCm2Preview(
                        maderaForm.anchoCm,
                        maderaForm.largoCm,
                      )}
                      placeholder="Se calcula del ancho y largo"
                      className={readOnlyInputClassName}
                    />
                  </label>
                  <label className={labelClassName}>
                    Cantidad
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={maderaForm.cantidad}
                      onChange={(event) =>
                        setMaderaForm({
                          ...maderaForm,
                          cantidad: event.target.value,
                        })
                      }
                      placeholder="0"
                      className={inputClassName}
                    />
                  </label>
                  <PriceFieldWithCalculator
                    label="Precio por cantidad cargada"
                    value={maderaForm.precio}
                    onChange={(precio) =>
                      setMaderaForm({ ...maderaForm, precio })
                    }
                    unitShort="pieza"
                    measureValue={maderaForm.cantidad}
                    measureLabel="Cantidad"
                    className={`${labelClassName} sm:col-span-2`}
                  />
                </div>
              )}

              {type === "cano" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={`${labelClassName} sm:col-span-2`}>
                    Descripción
                    <input
                      type="text"
                      value={canoForm.descripcion}
                      onChange={(event) =>
                        setCanoForm({
                          ...canoForm,
                          descripcion: event.target.value,
                        })
                      }
                      placeholder="Ej. Ø 40 mm"
                      className={inputClassName}
                    />
                  </label>
                  <label className={labelClassName}>
                    Largo (cm)
                    <input
                      type="number"
                      min="101"
                      step="any"
                      value={canoForm.largoCm}
                      onChange={(event) => {
                        const largoCm = event.target.value;
                        setCanoForm({
                          ...canoForm,
                          largoCm,
                          cantidad: largoCm,
                        });
                      }}
                      placeholder="300"
                      className={inputClassName}
                    />
                  </label>
                  <label className={labelClassName}>
                    Cantidad (cm)
                    <input
                      type="text"
                      readOnly
                      value={canoForm.cantidad}
                      placeholder="Se calcula del largo"
                      className={readOnlyInputClassName}
                    />
                  </label>
                  <PriceFieldWithCalculator
                    label="Precio por cm"
                    value={canoForm.precio}
                    onChange={(precio) =>
                      setCanoForm({ ...canoForm, precio })
                    }
                    unitShort="cm"
                    measureValue={canoForm.cantidad}
                    measureLabel="Cantidad (cm)"
                  />
                </div>
              )}
            </>
          )}

          <label className="flex items-start gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={usarEnProductos}
              onChange={(event) => setUsarEnProductos(event.target.checked)}
              className="mt-0.5 size-4 rounded border-zinc-300 text-amber-700 focus:ring-amber-600/20"
            />
            <span>
              Usar en cotizador
              <span className="mt-0.5 block text-xs font-normal text-zinc-500 dark:text-zinc-400">
                Si está desactivado, no aparece al armar productos.
              </span>
            </span>
          </label>

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
              {loading ? "Guardando..." : "Agregar al stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
