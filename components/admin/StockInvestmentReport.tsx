"use client";

import { useMemo } from "react";
import {
  ALL_STOCK_TYPES,
  BUYER_CONFIG,
  BUYER_TYPES,
  MATERIAL_CONFIG,
} from "@/lib/materials/constants";
import { calculateTotalPrice, formatPrice } from "@/lib/materials/format";
import type { BuyerType, MaterialType, StockEntry } from "@/lib/materials/types";

type StockInvestmentReportProps = {
  entries: StockEntry[];
};

function sumByBuyer(entries: StockEntry[]): { buyer: BuyerType; total: number }[] {
  const totals = Object.fromEntries(
    BUYER_TYPES.map((buyer) => [buyer, 0]),
  ) as Record<BuyerType, number>;

  for (const entry of entries) {
    totals[entry.compradoPor] += calculateTotalPrice(entry);
  }

  return BUYER_TYPES.map((buyer) => ({
    buyer,
    total: totals[buyer],
  })).filter((row) => row.total > 0);
}

function sumByCategory(
  entries: StockEntry[],
): { type: MaterialType; total: number }[] {
  const totals = Object.fromEntries(
    ALL_STOCK_TYPES.map((type) => [type, 0]),
  ) as Record<MaterialType, number>;

  for (const entry of entries) {
    totals[entry.type] += calculateTotalPrice(entry);
  }

  return ALL_STOCK_TYPES.map((type) => ({
    type,
    total: totals[type],
  })).filter((row) => row.total > 0);
}

export default function StockInvestmentReport({
  entries,
}: StockInvestmentReportProps) {
  const { grandTotal, byBuyer, byCategory } = useMemo(() => {
    const grandTotal = entries.reduce(
      (sum, entry) => sum + calculateTotalPrice(entry),
      0,
    );
    return {
      grandTotal,
      byBuyer: sumByBuyer(entries),
      byCategory: sumByCategory(entries),
    };
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        Total invertido:{" "}
        <span className="tabular-nums text-amber-800 dark:text-amber-400">
          {formatPrice(grandTotal)}
        </span>
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Por comprado por
          </p>
          <ul className="mt-2 space-y-1.5">
            {byBuyer.map(({ buyer, total }) => (
              <li
                key={buyer}
                className="flex items-center justify-between gap-3 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <span>{BUYER_CONFIG[buyer].label}</span>
                <span className="tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
                  {formatPrice(total)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Por categoría
          </p>
          <ul className="mt-2 space-y-1.5">
            {byCategory.map(({ type, total }) => (
              <li
                key={type}
                className="flex items-center justify-between gap-3 text-sm text-zinc-700 dark:text-zinc-300"
              >
                <span>{MATERIAL_CONFIG[type].label}</span>
                <span className="tabular-nums font-medium text-zinc-900 dark:text-zinc-50">
                  {formatPrice(total)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
