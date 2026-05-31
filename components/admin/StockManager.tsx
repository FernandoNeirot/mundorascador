"use client";

import { useCallback, useEffect, useState } from "react";
import StockInventoryTable from "@/components/admin/StockInventoryTable";
import {
  BUYER_CONFIG,
  BUYER_TYPES,
  isFabricLikeType,
  MATERIAL_CONFIG,
  MATERIAL_TYPES,
  WOOD_TYPE_CONFIG,
  WOOD_TYPES,
} from "@/lib/materials/constants";
import type {
  BuyerType,
  MaterialType,
  StockEntry,
  WoodType,
} from "@/lib/materials/types";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300";

const emptyTelaForm = {
  marca: "",
  anchoCm: "",
  largoCm: "",
  color: "",
  cantidad: "",
  precio: "",
};

const emptyMaderaForm = {
  anchoCm: "",
  largoCm: "",
  tipoMadera: "pino" as WoodType,
  cantidad: "",
  precio: "",
};

const emptyCanoForm = {
  anchoMm: "",
  largoCm: "",
  cantidad: "",
  precio: "",
};

const emptyHerramientaForm = {
  descripcion: "",
  cantidad: "",
  precio: "",
};

export default function StockManager({
  initialEntries,
  canWrite,
}: {
  initialEntries: StockEntry[];
  canWrite: boolean;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [esHerramienta, setEsHerramienta] = useState(false);
  const [type, setType] = useState<MaterialType>("telas");
  const [compradoPor, setCompradoPor] = useState<BuyerType>("fernando");
  const [telaForm, setTelaForm] = useState(emptyTelaForm);
  const [maderaForm, setMaderaForm] = useState(emptyMaderaForm);
  const [canoForm, setCanoForm] = useState(emptyCanoForm);
  const [herramientaForm, setHerramientaForm] = useState(emptyHerramientaForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshEntries = useCallback(async () => {
    const response = await fetch("/api/materials");
    if (response.ok) {
      setEntries(await response.json());
    }
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const resetForm = () => {
    setTelaForm(emptyTelaForm);
    setMaderaForm(emptyMaderaForm);
    setCanoForm(emptyCanoForm);
    setHerramientaForm(emptyHerramientaForm);
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
      };
    }

    if (isFabricLikeType(type)) {
      if (!telaForm.marca.trim()) {
        setError(`Ingresá la marca de la ${type === "guata" ? "guata" : "tela"}.`);
        return null;
      }
      if (!telaForm.color.trim()) {
        setError(`Ingresá el color de la ${type === "guata" ? "guata" : "tela"}.`);
        return null;
      }
      const anchoCm = parseField(telaForm.anchoCm, "El ancho");
      if (anchoCm === null) return null;
      const largoCm = parseField(telaForm.largoCm, "El largo");
      if (largoCm === null) return null;
      const quantity = parseField(telaForm.cantidad, "La cantidad");
      if (quantity === null) return null;
      const price = parseField(telaForm.precio, "El precio");
      if (price === null) return null;

      return {
        type,
        marca: telaForm.marca.trim(),
        anchoCm,
        largoCm,
        color: telaForm.color.trim(),
        quantity,
        price,
        compradoPor,
      };
    }

    if (type === "maderas") {
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
        anchoCm,
        largoCm,
        tipoMadera: maderaForm.tipoMadera,
        quantity,
        price,
        compradoPor,
      };
    }

    const anchoMm = parseField(canoForm.anchoMm, "El ancho");
    if (anchoMm === null) return null;
    const largoCm = parseField(canoForm.largoCm, "El largo");
    if (largoCm === null) return null;
    const quantity = parseField(canoForm.cantidad, "La cantidad");
    if (quantity === null) return null;
    const price = parseField(canoForm.precio, "El precio");
    if (price === null) return null;

    return {
      type: "cano_pvc",
      anchoMm,
      largoCm,
      quantity,
      price,
      compradoPor,
    };
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = buildPayload();
    if (!payload) return;

    setLoading(true);
    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "No se pudo guardar el stock.");
        return;
      }

      await refreshEntries();
      resetForm();
      setSuccess("Stock cargado correctamente.");
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header>
        <p className="text-sm font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Administración
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Stock e inversiones
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          {canWrite
            ? "Cada carga genera un registro independiente. La tabla agrupa ítems iguales y suma cantidades e inversiones, pero podés ver y editar cada compra por separado."
            : "Tenés acceso de solo lectura. Podés consultar el stock y las inversiones agrupadas."}
        </p>
      </header>

      {canWrite && (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Cargar stock
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <label className="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={esHerramienta}
              onChange={(event) => {
                setEsHerramienta(event.target.checked);
                setError(null);
                setSuccess(null);
              }}
              className="size-4 rounded border-zinc-300 text-amber-700 focus:ring-amber-600/20"
            />
            Agregar producto genérico
          </label>

          {esHerramienta ? (
            <div className="grid gap-5 sm:grid-cols-2">
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
              <label className={`${labelClassName} sm:col-span-2`}>
                Precio por unidad
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={herramientaForm.precio}
                  onChange={(event) =>
                    setHerramientaForm({
                      ...herramientaForm,
                      precio: event.target.value,
                    })
                  }
                  placeholder="0"
                  className={inputClassName}
                />
              </label>
            </div>
          ) : (
            <>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className={labelClassName}>
              Tipo de material
              <select
                value={type}
                onChange={(event) => {
                  setType(event.target.value as MaterialType);
                  setError(null);
                  setSuccess(null);
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
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <label className={labelClassName}>
                Marca
                <input
                  type="text"
                  value={telaForm.marca}
                  onChange={(event) =>
                    setTelaForm({ ...telaForm, marca: event.target.value })
                  }
                  placeholder={type === "guata" ? "Ej: Guata premium" : "Ej: Santista"}
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
                  min="0.01"
                  step="any"
                  value={telaForm.largoCm}
                  onChange={(event) =>
                    setTelaForm({ ...telaForm, largoCm: event.target.value })
                  }
                  placeholder="200"
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
                Cantidad
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={telaForm.cantidad}
                  onChange={(event) =>
                    setTelaForm({ ...telaForm, cantidad: event.target.value })
                  }
                  placeholder="0"
                  className={inputClassName}
                />
              </label>
              <label className={labelClassName}>
                Precio por metro
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={telaForm.precio}
                  onChange={(event) =>
                    setTelaForm({ ...telaForm, precio: event.target.value })
                  }
                  placeholder="0"
                  className={inputClassName}
                />
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  El precio equivale a cada 100 cm (1 metro) de{" "}
                  {type === "guata" ? "guata" : "tela"}.
                </span>
              </label>
            </div>
          )}

          {type === "maderas" && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
              <label className={labelClassName}>
                Precio por unidad
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={maderaForm.precio}
                  onChange={(event) =>
                    setMaderaForm({ ...maderaForm, precio: event.target.value })
                  }
                  placeholder="0"
                  className={inputClassName}
                />
              </label>
            </div>
          )}

          {type === "cano_pvc" && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <label className={labelClassName}>
                Ancho (mm)
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={canoForm.anchoMm}
                  onChange={(event) =>
                    setCanoForm({ ...canoForm, anchoMm: event.target.value })
                  }
                  placeholder="40"
                  className={inputClassName}
                />
              </label>
              <label className={labelClassName}>
                Largo (cm)
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={canoForm.largoCm}
                  onChange={(event) =>
                    setCanoForm({ ...canoForm, largoCm: event.target.value })
                  }
                  placeholder="300"
                  className={inputClassName}
                />
              </label>
              <label className={labelClassName}>
                Cantidad
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={canoForm.cantidad}
                  onChange={(event) =>
                    setCanoForm({ ...canoForm, cantidad: event.target.value })
                  }
                  placeholder="0"
                  className={inputClassName}
                />
              </label>
              <label className={labelClassName}>
                Precio por unidad
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={canoForm.precio}
                  onChange={(event) =>
                    setCanoForm({ ...canoForm, precio: event.target.value })
                  }
                  placeholder="0"
                  className={inputClassName}
                />
              </label>
            </div>
          )}

          </>
          )}

          <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-h-5 text-sm">
              {error && (
                <p className="text-red-600 dark:text-red-400">{error}</p>
              )}
              {success && (
                <p className="text-emerald-600 dark:text-emerald-400">
                  {success}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-amber-700 px-5 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Agregar al stock"}
            </button>
          </div>
        </form>
      </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
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

        <StockInventoryTable
          entries={entries}
          onRefresh={refreshEntries}
          canWrite={canWrite}
        />
      </section>
    </div>
  );
}
