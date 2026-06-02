"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/materials/format";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300";

type PriceFieldWithCalculatorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  unitShort: string;
  measureValue: string;
  measureLabel: string;
  className?: string;
};

export default function PriceFieldWithCalculator({
  label,
  value,
  onChange,
  unitShort,
  measureValue,
  measureLabel,
  className = labelClassName,
}: PriceFieldWithCalculatorProps) {
  const [calcOpen, setCalcOpen] = useState(false);
  const [totalPrice, setTotalPrice] = useState("");
  const [measure, setMeasure] = useState("");

  useEffect(() => {
    if (!calcOpen) return;
    setMeasure(measureValue);
    setTotalPrice("");
  }, [calcOpen, measureValue]);

  const parsedTotal = Number(totalPrice);
  const parsedMeasure = Number(measure);
  const unitPrice =
    Number.isFinite(parsedTotal) &&
    parsedTotal > 0 &&
    Number.isFinite(parsedMeasure) &&
    parsedMeasure > 0
      ? parsedTotal / parsedMeasure
      : null;

  const apply = () => {
    if (unitPrice === null) return;
    const rounded = Math.round(unitPrice * 100) / 100;
    onChange(String(rounded));
    setCalcOpen(false);
  };

  return (
    <>
      <label className={className}>
        {label}
        <div className="flex gap-2">
          <input
            type="number"
            min="0.01"
            step="any"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="0"
            className={`${inputClassName} min-w-0 flex-1`}
          />
          <button
            type="button"
            onClick={() => setCalcOpen(true)}
            title="Calcular precio unitario"
            className="shrink-0 rounded-lg border border-amber-600/40 px-3 text-sm font-medium text-amber-800 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
          >
            Calc.
          </button>
        </div>
      </label>

      {calcOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="unit-price-calculator-title"
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            <h4
              id="unit-price-calculator-title"
              className="text-lg font-medium text-zinc-900 dark:text-zinc-50"
            >
              Calcular precio por {unitShort}
            </h4>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Ingresá el precio total y la medida para obtener el precio
              unitario.
            </p>

            <div className="mt-5 flex flex-col gap-4">
              <label className={labelClassName}>
                Precio total
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={totalPrice}
                  onChange={(event) => setTotalPrice(event.target.value)}
                  placeholder="0"
                  autoFocus
                  className={inputClassName}
                />
              </label>
              <label className={labelClassName}>
                {measureLabel}
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={measure}
                  onChange={(event) => setMeasure(event.target.value)}
                  placeholder="0"
                  className={inputClassName}
                />
              </label>

              <div className="rounded-lg bg-zinc-50 px-4 py-3 dark:bg-zinc-900/60">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Precio por {unitShort}
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {unitPrice !== null ? formatPrice(unitPrice) : "—"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCalcOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={apply}
                disabled={unitPrice === null}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-700 px-4 text-sm font-medium text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Usar precio
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
