"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildCortesUpdatePayload,
  getRemainingCm2,
  getStockCm2,
  getUsedCm2,
  KERF_CM_PER_SIDE,
  superficieCorteUsadaCm2,
  totalSuperficieCortesUsadaCm2,
} from "@/lib/materials/cortes";
import { formatEntryDetails } from "@/lib/materials/format";
import { MATERIAL_CONFIG } from "@/lib/materials/constants";
import { formatSuperficieCm2 } from "@/lib/materials/superficie";
import type { StockCorte, StockEntryWithCortes } from "@/lib/materials/types";
import { useTenantPaths } from "@/lib/tenant/context";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300";

const readOnlyInputClassName = `${inputClassName} cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/60`;

type DraftCorte = {
  id: string;
  anchoCm: string;
  largoCm: string;
};

type CortesStockDialogProps = {
  entry: StockEntryWithCortes | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

function toDraft(cortes: StockCorte[]): DraftCorte[] {
  return cortes.map((corte) => ({
    id: corte.id,
    anchoCm: String(corte.anchoCm),
    largoCm: String(corte.largoCm),
  }));
}

function isDraftEmpty(draft: DraftCorte): boolean {
  return !draft.anchoCm.trim() && !draft.largoCm.trim();
}

function isDraftComplete(draft: DraftCorte): boolean {
  const anchoCm = Number(draft.anchoCm);
  const largoCm = Number(draft.largoCm);
  return (
    Number.isFinite(anchoCm) &&
    anchoCm > 0 &&
    Number.isFinite(largoCm) &&
    largoCm > 0
  );
}

function isDraftPartial(draft: DraftCorte): boolean {
  return !isDraftEmpty(draft) && !isDraftComplete(draft);
}

/** Solo cortes con ancho y largo válidos (filas vacías se ignoran). */
function parseCompleteDraftCortes(drafts: DraftCorte[]): StockCorte[] {
  return drafts.filter(isDraftComplete).map((draft) => ({
    id: draft.id,
    anchoCm: Number(draft.anchoCm),
    largoCm: Number(draft.largoCm),
  }));
}

function parseDraftCortesForSubmit(drafts: DraftCorte[]): StockCorte[] | string {
  if (drafts.some(isDraftPartial)) {
    return "Completá ancho y largo de cada corte, o quitá las filas incompletas.";
  }
  return parseCompleteDraftCortes(drafts);
}

export default function CortesStockDialog({
  entry,
  open,
  onClose,
  onSaved,
}: CortesStockDialogProps) {
  const { materialsApi } = useTenantPaths();
  const [drafts, setDrafts] = useState<DraftCorte[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !entry) return;
    setDrafts(toDraft(entry.cortes ?? []));
    setError(null);
  }, [open, entry]);

  const previewCortes = useMemo(
    () => parseCompleteDraftCortes(drafts),
    [drafts],
  );

  const previewEntry = useMemo((): StockEntryWithCortes | null => {
    if (!entry) return null;
    return { ...entry, cortes: previewCortes };
  }, [entry, previewCortes]);

  const stockCm2 = entry ? getStockCm2(entry) : 0;
  const usedCm2 = previewEntry ? getUsedCm2(previewEntry) : 0;
  const remainingCm2 = previewEntry ? getRemainingCm2(previewEntry) : 0;

  if (!open || !entry) return null;

  const addCorte = () => {
    setDrafts((current) => [
      ...current,
      { id: crypto.randomUUID(), anchoCm: "", largoCm: "" },
    ]);
  };

  const updateDraft = (
    id: string,
    field: "anchoCm" | "largoCm",
    value: string,
  ) => {
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === id ? { ...draft, [field]: value } : draft,
      ),
    );
  };

  const removeDraft = (id: string) => {
    setDrafts((current) => current.filter((draft) => draft.id !== id));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const parsed = parseDraftCortesForSubmit(drafts);
    if (typeof parsed === "string") {
      setError(parsed);
      return;
    }

    const used = totalSuperficieCortesUsadaCm2(parsed);
    if (used > stockCm2) {
      setError("La superficie de los cortes supera el stock disponible.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${materialsApi}/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCortesUpdatePayload(entry, parsed)),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "No se pudieron guardar los cortes.");
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Cortes de {MATERIAL_CONFIG[entry.type].label.toLowerCase()}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {formatEntryDetails(entry)}
            </p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Se suma {KERF_CM_PER_SIDE} cm por lado al calcular la superficie
              usada (pérdida de corte).
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
          {drafts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Todavía no hay cortes cargados.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {drafts.map((draft, index) => {
                const ancho = Number(draft.anchoCm);
                const largo = Number(draft.largoCm);
                const superficiePreview =
                  Number.isFinite(ancho) &&
                  ancho > 0 &&
                  Number.isFinite(largo) &&
                  largo > 0
                    ? formatSuperficieCm2(
                        superficieCorteUsadaCm2(ancho, largo),
                      )
                    : "—";

                return (
                  <li
                    key={draft.id}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Corte {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDraft(draft.id)}
                        className="text-xs font-medium text-red-600 transition hover:text-red-700 dark:text-red-400"
                      >
                        Quitar
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className={labelClassName}>
                        Ancho (cm)
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={draft.anchoCm}
                          onChange={(event) =>
                            updateDraft(draft.id, "anchoCm", event.target.value)
                          }
                          className={inputClassName}
                        />
                      </label>
                      <label className={labelClassName}>
                        Largo (cm)
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={draft.largoCm}
                          onChange={(event) =>
                            updateDraft(draft.id, "largoCm", event.target.value)
                          }
                          className={inputClassName}
                        />
                      </label>
                      <label className={`${labelClassName} sm:col-span-2`}>
                        Superficie descontada
                        <input
                          type="text"
                          readOnly
                          value={superficiePreview}
                          className={readOnlyInputClassName}
                        />
                      </label>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={addCorte}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-dashed border-amber-600/50 px-4 text-sm font-medium text-amber-800 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
          >
            + Agregar corte
          </button>

          <div className="grid gap-3 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-900/50 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Stock
              </p>
              <p className="mt-1 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatSuperficieCm2(stockCm2)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Usado
              </p>
              <p className="mt-1 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatSuperficieCm2(usedCm2)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Restante
              </p>
              <p className="mt-1 font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatSuperficieCm2(remainingCm2)}
              </p>
            </div>
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
              {loading ? "Guardando..." : "Guardar cortes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
