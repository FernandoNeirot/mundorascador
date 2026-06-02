"use client";

import { formatSuperficieCm2 } from "@/lib/materials/superficie";
import { parseCutCm2 } from "@/lib/materials/quote-line";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300";

const readOnlyInputClassName = `${inputClassName} cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/60`;

type QuoteCutInputsProps = {
  anchoCm: string;
  largoCm: string;
  pieceCount?: string;
  showPieceCount?: boolean;
  onAnchoChange: (value: string) => void;
  onLargoChange: (value: string) => void;
  onPieceCountChange?: (value: string) => void;
};

export default function QuoteCutInputs({
  anchoCm,
  largoCm,
  pieceCount = "1",
  showPieceCount = false,
  onAnchoChange,
  onLargoChange,
  onPieceCountChange,
}: QuoteCutInputsProps) {
  const cm2 = parseCutCm2(anchoCm, largoCm);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Corte (ancho × largo)
      </p>
      <div className={`grid gap-4 ${showPieceCount ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        <label className={labelClassName}>
          Ancho (cm)
          <input
            type="number"
            min="0.01"
            step="any"
            value={anchoCm}
            onChange={(event) => onAnchoChange(event.target.value)}
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
            onChange={(event) => onLargoChange(event.target.value)}
            className={inputClassName}
          />
        </label>
        {showPieceCount && onPieceCountChange && (
          <label className={labelClassName}>
            Cantidad
            <input
              type="number"
              min="1"
              step="1"
              value={pieceCount}
              onChange={(event) => onPieceCountChange(event.target.value)}
              className={inputClassName}
            />
          </label>
        )}
      </div>
      <label className={labelClassName}>
        Superficie del corte
        <input
          type="text"
          readOnly
          value={cm2 !== null ? formatSuperficieCm2(cm2) : "—"}
          className={readOnlyInputClassName}
        />
      </label>
    </div>
  );
}
