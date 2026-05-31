"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/materials/format";
import {
  buildQuoteProductOptions,
  type QuoteProductOption,
} from "@/lib/materials/quote-products";
import type { StockEntry } from "@/lib/materials/types";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300";

const detailLabelClassName =
  "text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

const detailValueClassName =
  "text-sm text-zinc-900 dark:text-zinc-50";

function ProductDetails({ product }: { product: QuoteProductOption }) {
  const unitShort = product.quantityUnit === "metros" ? "m" : "u";
  const unitLong = product.quantityUnit === "metros" ? "metro" : "unidad";

  return (
    <dl className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex flex-col gap-1">
        <dt className={detailLabelClassName}>Tipo</dt>
        <dd className={detailValueClassName}>{product.materialLabel}</dd>
      </div>
      <div className="flex flex-col gap-1 sm:col-span-2">
        <dt className={detailLabelClassName}>Detalle</dt>
        <dd className={detailValueClassName}>{product.details}</dd>
      </div>
      <div className="flex flex-col gap-1">
        <dt className={detailLabelClassName}>Precio unitario</dt>
        <dd className={`${detailValueClassName} tabular-nums`}>
          {formatPrice(product.unitPrice)}/{unitShort}
        </dd>
        <dd className="text-xs text-zinc-500 dark:text-zinc-400">
          Por {unitLong}
        </dd>
      </div>
    </dl>
  );
}

type QuoteLine = {
  id: string;
  productKey: string;
  quantityUsed: string;
};

const emptyLine = (products: QuoteProductOption[]): QuoteLine => ({
  id: crypto.randomUUID(),
  productKey: products[0]?.key ?? "",
  quantityUsed: "",
});

export default function Cotizador({
  initialEntries,
}: {
  initialEntries: StockEntry[];
}) {
  const products = useMemo(
    () => buildQuoteProductOptions(initialEntries),
    [initialEntries],
  );

  const [lines, setLines] = useState<QuoteLine[]>(() =>
    products.length > 0 ? [emptyLine(products)] : [],
  );

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.key, product])),
    [products],
  );

  const getLineCost = (line: QuoteLine): number => {
    const product = productMap.get(line.productKey);
    const quantity = Number(line.quantityUsed);
    if (!product || !Number.isFinite(quantity) || quantity <= 0) return 0;
    return quantity * product.unitPrice;
  };

  const totalCost = lines.reduce((sum, line) => sum + getLineCost(line), 0);

  const updateLine = (id: string, patch: Partial<QuoteLine>) => {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  };

  const addLine = () => {
    setLines((current) => [...current, emptyLine(products)]);
  };

  const removeLine = (id: string) => {
    setLines((current) =>
      current.length <= 1 ? current : current.filter((line) => line.id !== id),
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
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
          Agregá productos por descripción, indicá la cantidad usada y calculá
          el costo según el precio unitario del stock.
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
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-6">
            {lines.map((line, index) => {
              const product = productMap.get(line.productKey);
              const lineCost = getLineCost(line);

              return (
                <div
                  key={line.id}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Producto {index + 1}
                    </p>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        className="text-sm font-medium text-red-600 transition hover:text-red-700 dark:text-red-400"
                      >
                        Quitar
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <label className={labelClassName}>
                      Descripción
                      <select
                        value={line.productKey}
                        onChange={(event) =>
                          updateLine(line.id, {
                            productKey: event.target.value,
                          })
                        }
                        className={inputClassName}
                      >
                        {products.map((option) => (
                          <option key={option.key} value={option.key}>
                            {option.descripcion}
                          </option>
                        ))}
                      </select>
                    </label>

                    {product && <ProductDetails product={product} />}

                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className={labelClassName}>
                        Cantidad usada ({product?.quantityUnit ?? "unidades"})
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={line.quantityUsed}
                          onChange={(event) =>
                            updateLine(line.id, {
                              quantityUsed: event.target.value,
                            })
                          }
                          placeholder="0"
                          className={inputClassName}
                        />
                      </label>

                      <label className={labelClassName}>
                        Costo
                        <input
                          type="text"
                          readOnly
                          value={lineCost > 0 ? formatPrice(lineCost) : "—"}
                          className={`${inputClassName} cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/60`}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={addLine}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Agregar producto
            </button>
            <div className="text-right">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Costo total
              </p>
              <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatPrice(totalCost)}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
