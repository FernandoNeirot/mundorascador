"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CotizacionEditor from "@/components/admin/CotizacionEditor";
import CotizacionList from "@/components/admin/CotizacionList";
import { buildQuoteProductOptions } from "@/lib/materials/quote-products";
import type { Cotizacion } from "@/lib/cotizador/types";
import type { CommittedQuoteLine } from "@/lib/materials/quote-line";
import type { StockEntry } from "@/lib/materials/types";

type CotizadorProps = {
  initialEntries: StockEntry[];
  initialCotizaciones: Cotizacion[];
  canWrite: boolean;
};

export default function Cotizador({
  initialEntries,
  initialCotizaciones,
  canWrite,
}: CotizadorProps) {
  const products = useMemo(
    () => buildQuoteProductOptions(initialEntries),
    [initialEntries],
  );

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.key, product])),
    [products],
  );

  const [cotizaciones, setCotizaciones] =
    useState<Cotizacion[]>(initialCotizaciones);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCotizaciones[0]?.id ?? null,
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = cotizaciones.find(
    (cotizacion) => cotizacion.id === selectedId,
  );

  const updateSelected = (patch: Partial<Cotizacion>) => {
    if (!selectedId) return;
    setCotizaciones((current) =>
      current.map((cotizacion) =>
        cotizacion.id === selectedId
          ? { ...cotizacion, ...patch }
          : cotizacion,
      ),
    );
    setDirty(true);
    setError(null);
  };

  const handleSelect = (id: string) => {
    if (dirty) {
      const confirmLeave = window.confirm(
        "Hay cambios sin guardar. ¿Querés cambiar de cotización igual?",
      );
      if (!confirmLeave) return;
    }
    setSelectedId(id);
    setDirty(false);
    setError(null);
  };

  const handleCreate = async () => {
    if (!canWrite) return;
    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/cotizador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: "Nueva cotización",
          descripcion: "",
          materiales: [],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "No se pudo crear la cotización.");
        return;
      }

      setCotizaciones((current) => [data, ...current]);
      setSelectedId(data.id);
      setDirty(false);
    } catch {
      setError("Error de conexión al crear la cotización.");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!canWrite || !selected) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/cotizador/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: selected.nombre,
          descripcion: selected.descripcion,
          materiales: selected.materiales,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "No se pudo guardar la cotización.");
        return;
      }

      setCotizaciones((current) =>
        current.map((cotizacion) =>
          cotizacion.id === data.id ? data : cotizacion,
        ),
      );
      setDirty(false);
    } catch {
      setError("Error de conexión al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canWrite || !selected) return;

    const confirmed = window.confirm(
      `¿Eliminar la cotización "${selected.nombre}"?`,
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/cotizador/${selected.id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "No se pudo eliminar la cotización.");
        return;
      }

      const remaining = cotizaciones.filter(
        (cotizacion) => cotizacion.id !== selected.id,
      );
      setCotizaciones(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      setDirty(false);
    } catch {
      setError("Error de conexión al eliminar.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <Link
          href="/admin"
          className="text-sm font-medium text-amber-700 transition hover:text-amber-800 dark:text-amber-400"
        >
          ← Volver al panel
        </Link>
        <p className="mt-4 text-sm font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Administración
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Cotizador
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Cada cotización es un producto con nombre, descripción y materiales.
          Los datos se guardan en Firebase.
        </p>
      </header>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          No hay productos en stock todavía.{" "}
          <Link href="/admin/stock" className="font-medium text-amber-700">
            Cargá stock
          </Link>{" "}
          para usar el cotizador.
        </div>
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
          <CotizacionList
            cotizaciones={cotizaciones}
            selectedId={selectedId}
            productMap={productMap}
            canWrite={canWrite}
            onSelect={handleSelect}
            onCreate={handleCreate}
            creating={creating}
          />

          {selected ? (
            <CotizacionEditor
              cotizacion={selected}
              products={products}
              productMap={productMap}
              canWrite={canWrite}
              dirty={dirty}
              saving={saving}
              deleting={deleting}
              error={error}
              onNombreChange={(nombre) => updateSelected({ nombre })}
              onDescripcionChange={(descripcion) =>
                updateSelected({ descripcion })
              }
              onMaterialesChange={(materiales: CommittedQuoteLine[]) =>
                updateSelected({ materiales })
              }
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ) : (
            <section className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
              {canWrite
                ? "Creá una cotización nueva o seleccioná una de la lista."
                : "Seleccioná una cotización de la lista."}
            </section>
          )}
        </div>
      )}

      {error && !selected && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
