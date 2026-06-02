"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CotizacionEditor from "@/components/admin/CotizacionEditor";
import CotizacionList from "@/components/admin/CotizacionList";
import { buildQuoteProductOptions } from "@/lib/materials/quote-products";
import { isCotizacionOwnedBy } from "@/lib/cotizador/permissions";
import type { Cotizacion } from "@/lib/cotizador/types";
import type { CommittedQuoteLine } from "@/lib/materials/quote-line";
import type { StockEntry } from "@/lib/materials/types";

const DRAFT_ID = "__draft__";

function createDraftCotizacion(): Cotizacion {
  const now = new Date().toISOString();
  return {
    id: DRAFT_ID,
    nombre: "",
    descripcion: "",
    materiales: [],
    createdAt: now,
    updatedAt: now,
    createdBy: "",
  };
}

type CotizadorProps = {
  initialEntries: StockEntry[];
  initialCotizaciones: Cotizacion[];
  canWrite: boolean;
  currentUsername: string;
};

export default function Cotizador({
  initialEntries,
  initialCotizaciones,
  canWrite,
  currentUsername,
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
  const [draftCotizacion, setDraftCotizacion] = useState<Cotizacion | null>(
    null,
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDraft = selectedId === DRAFT_ID;
  const selected = isDraft
    ? draftCotizacion
    : cotizaciones.find((cotizacion) => cotizacion.id === selectedId);

  const canEditSelected =
    isDraft && selected
      ? canWrite
      : selected
        ? canWrite && isCotizacionOwnedBy(currentUsername, selected)
        : false;

  const updateSelected = (patch: Partial<Cotizacion>) => {
    if (isDraft) {
      setDraftCotizacion((current) =>
        current ? { ...current, ...patch } : current,
      );
      setDirty(true);
      setError(null);
      return;
    }

    if (!selectedId) return;
    if (!canEditSelected) return;
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

  const discardDraft = () => {
    setDraftCotizacion(null);
    setSelectedId(null);
    setDirty(false);
    setError(null);
  };

  const handleClose = () => {
    if (dirty) {
      const confirmLeave = window.confirm(
        isDraft
          ? "Hay cambios sin guardar. ¿Querés descartar la cotización nueva?"
          : "Hay cambios sin guardar. ¿Querés cerrar igual?",
      );
      if (!confirmLeave) return;
    }

    if (isDraft) {
      discardDraft();
      return;
    }

    setSelectedId(null);
    setDirty(false);
    setError(null);
  };

  const handleOpen = (id: string) => {
    if (isDraft) {
      if (dirty) {
        const confirmLeave = window.confirm(
          "Hay una cotización nueva sin guardar. ¿Querés descartarla y abrir otra?",
        );
        if (!confirmLeave) return;
      }
      setDraftCotizacion(null);
    } else if (dirty && selectedId) {
      const confirmLeave = window.confirm(
        "Hay cambios sin guardar. ¿Querés cambiar de cotización igual?",
      );
      if (!confirmLeave) return;
    }

    setSelectedId(id);
    setDirty(false);
    setError(null);
  };

  const handleCreate = () => {
    if (!canWrite) return;

    if (isDraft) {
      if (dirty) {
        const confirmReplace = window.confirm(
          "Hay una cotización nueva sin guardar. ¿Querés descartarla y empezar otra?",
        );
        if (!confirmReplace) return;
      }
      setDraftCotizacion(null);
    }

    setError(null);
    setDraftCotizacion(createDraftCotizacion());
    setSelectedId(DRAFT_ID);
    setDirty(true);
  };

  const handleSave = async () => {
    if (!canEditSelected || !selected) return;

    setSaving(true);
    setError(null);

    const payload = {
      nombre: selected.nombre,
      descripcion: selected.descripcion,
      materiales: selected.materiales,
    };

    try {
      if (isDraft) {
        const response = await fetch("/api/cotizador", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "No se pudo crear la cotización.");
          return;
        }

        setCotizaciones((current) => [data, ...current]);
        setDraftCotizacion(null);
        setSelectedId(data.id);
        setDirty(false);
        return;
      }

      const response = await fetch(`/api/cotizador/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      setError(
        isDraft
          ? "Error de conexión al crear la cotización."
          : "Error de conexión al guardar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canEditSelected || !selected) return;

    if (isDraft) {
      const confirmed = window.confirm(
        "¿Descartar la cotización nueva sin guardar?",
      );
      if (!confirmed) return;
      discardDraft();
      return;
    }

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

      setCotizaciones((current) =>
        current.filter((cotizacion) => cotizacion.id !== selected.id),
      );
      setSelectedId(null);
      setDirty(false);
    } catch {
      setError("Error de conexión al eliminar.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
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
        <CotizacionList
          cotizaciones={cotizaciones}
          productMap={productMap}
          canWrite={canWrite}
          currentUsername={currentUsername}
          onOpen={handleOpen}
          onCreate={handleCreate}
        />
      )}

      {error && !selected && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cotizacion-editor-title"
            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="overflow-y-auto p-4 sm:p-6">
              <CotizacionEditor
                cotizacion={selected}
                products={products}
                productMap={productMap}
                canWrite={canEditSelected}
                viewOnlyNote={
                  !canEditSelected && !isDraft && canWrite
                    ? "Solo podés editar tus propias cotizaciones."
                    : undefined
                }
                dirty={dirty}
                saving={saving}
                deleting={deleting}
                isDraft={isDraft}
                error={error}
                inModal
                onClose={handleClose}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
