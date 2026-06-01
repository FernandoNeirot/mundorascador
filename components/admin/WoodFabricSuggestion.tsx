"use client";

import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/materials/format";
import { formatSuperficieCm2 } from "@/lib/materials/superficie";
import type { QuoteProductOption } from "@/lib/materials/quote-products";
import {
  calculateFabricCostFromCm2,
  FABRIC_LATERAL_OVERHANG_CM,
} from "@/lib/materials/wood-fabric-quote";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const disabledInputClassName =
  "rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-normal text-zinc-600 outline-none dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400";

const labelClassName =
  "flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300";

const readOnlyInputClassName = `${inputClassName} cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/60`;

export type WoodFabricDraft = {
  woodAnchoCm: string;
  woodLargoCm: string;
  fabricAnchoCm: string;
  fabricLargoCm: string;
  fabricProductKey: string;
  fabricDimsEdited: boolean;
  fabricConfirmed: boolean;
};

export const emptyWoodFabricDraft = (
  telaProducts: QuoteProductOption[],
): WoodFabricDraft => ({
  woodAnchoCm: "",
  woodLargoCm: "",
  fabricAnchoCm: "",
  fabricLargoCm: "",
  fabricProductKey: telaProducts[0]?.key ?? "",
  fabricDimsEdited: false,
  fabricConfirmed: false,
});

type WoodFabricSuggestionProps = {
  telaProducts: QuoteProductOption[];
  draft: WoodFabricDraft;
  woodPieceCount: string;
  onDraftChange: (draft: WoodFabricDraft) => void;
};

export default function WoodFabricSuggestion({
  telaProducts,
  draft,
  woodPieceCount,
  onDraftChange,
}: WoodFabricSuggestionProps) {
  const [error, setError] = useState<string | null>(null);

  const woodAncho = Number(draft.woodAnchoCm);
  const woodLargo = Number(draft.woodLargoCm);
  const woodValid =
    Number.isFinite(woodAncho) &&
    woodAncho > 0 &&
    Number.isFinite(woodLargo) &&
    woodLargo > 0;

  const fabricAncho = Number(draft.fabricAnchoCm);
  const fabricLargo = Number(draft.fabricLargoCm);
  const fabricValid =
    Number.isFinite(fabricAncho) &&
    fabricAncho > 0 &&
    Number.isFinite(fabricLargo) &&
    fabricLargo > 0;

  const superficieCm2 = fabricValid ? fabricAncho * fabricLargo : 0;
  const pieces = Math.max(1, Number(woodPieceCount) || 1);
  const locked = draft.fabricConfirmed;

  const selectedTela = useMemo(
    () => telaProducts.find((p) => p.key === draft.fabricProductKey),
    [telaProducts, draft.fabricProductKey],
  );

  const estimatedCost = selectedTela
    ? calculateFabricCostFromCm2(superficieCm2, selectedTela.unitPrice) * pieces
    : 0;

  const handleConfirm = () => {
    setError(null);
    if (!woodValid) {
      setError("Completá el corte de madera (ancho y largo) arriba.");
      return;
    }
    if (!fabricValid) {
      setError("Ingresá las medidas del corte de tela sugerido.");
      return;
    }
    if (!draft.fabricProductKey || !selectedTela) {
      setError("Seleccioná una tela del stock.");
      return;
    }

    onDraftChange({ ...draft, fabricConfirmed: true });
  };

  const handleRemove = () => {
    setError(null);
    onDraftChange({ ...draft, fabricConfirmed: false });
  };

  if (telaProducts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No hay telas en stock para calcular el recorte sugerido.
      </p>
    );
  }

  const fieldClassName = locked ? disabledInputClassName : inputClassName;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Se suman {FABRIC_LATERAL_OVERHANG_CM} cm por lado (espesor 2 cm + 3 cm de
        agarre). Ej.: madera 50×40 cm → tela 60×90 cm. La tela se agrega junto
        con la madera al confirmar.
      </p>

      {locked && selectedTela && (
        <div
          role="status"
          className="rounded-lg border border-emerald-600/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-600/20 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          <p className="font-medium">Tela incluida</p>
          <p className="mt-1 text-emerald-800 dark:text-emerald-300">
            {selectedTela.descripcion} · {draft.fabricAnchoCm} ×{" "}
            {draft.fabricLargoCm} cm
            {pieces > 1 && ` · ${pieces} piezas`}
            {estimatedCost > 0 && (
              <>
                {" "}
                · {formatPrice(estimatedCost)}
              </>
            )}
          </p>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
            Se sumará a la cotización cuando agregues la madera.
          </p>
        </div>
      )}

      <label className={labelClassName}>
        Tela del stock
        <select
          value={draft.fabricProductKey}
          disabled={locked}
          onChange={(event) =>
            onDraftChange({
              ...draft,
              fabricProductKey: event.target.value,
              fabricConfirmed: false,
            })
          }
          className={fieldClassName}
        >
          {telaProducts.map((tela) => (
            <option key={tela.key} value={tela.key}>
              {tela.descripcion} · {tela.details}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Tela sugerida — ancho (cm)
          <input
            type="number"
            min="0.01"
            step="any"
            value={draft.fabricAnchoCm}
            disabled={locked}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                fabricAnchoCm: event.target.value,
                fabricDimsEdited: true,
                fabricConfirmed: false,
              })
            }
            className={fieldClassName}
          />
        </label>
        <label className={labelClassName}>
          Tela sugerida — largo (cm)
          <input
            type="number"
            min="0.01"
            step="any"
            value={draft.fabricLargoCm}
            disabled={locked}
            onChange={(event) =>
              onDraftChange({
                ...draft,
                fabricLargoCm: event.target.value,
                fabricDimsEdited: true,
                fabricConfirmed: false,
              })
            }
            className={fieldClassName}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Superficie de tela
          <input
            type="text"
            readOnly
            value={
              fabricValid
                ? pieces > 1
                  ? `${formatSuperficieCm2(superficieCm2)} × ${pieces} piezas`
                  : formatSuperficieCm2(superficieCm2)
                : "—"
            }
            className={readOnlyInputClassName}
          />
        </label>
        <label className={labelClassName}>
          Costo estimado de tela
          <input
            type="text"
            readOnly
            value={estimatedCost > 0 ? formatPrice(estimatedCost) : "—"}
            className={readOnlyInputClassName}
          />
          {selectedTela && (
            <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
              {formatPrice(selectedTela.unitPrice)}/cm²
            </span>
          )}
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {locked ? (
        <button
          type="button"
          onClick={handleRemove}
          className="inline-flex h-10 items-center justify-center self-start rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          Quitar tela
        </button>
      ) : (
        <button
          type="button"
          onClick={handleConfirm}
          className="inline-flex h-10 items-center justify-center self-start rounded-lg bg-amber-700 px-4 text-sm font-medium text-white transition hover:bg-amber-800"
        >
          Incluir tela
        </button>
      )}
    </div>
  );
}
