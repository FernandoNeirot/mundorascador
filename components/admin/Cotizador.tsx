"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AddQuoteLineDialog from "@/components/admin/AddQuoteLineDialog";
import QuoteLinesTable from "@/components/admin/QuoteLinesTable";
import { formatPrice } from "@/lib/materials/format";
import { buildQuoteProductOptions } from "@/lib/materials/quote-products";
import {
  findPairedLine,
  getQuoteLineCost,
  type CommittedQuoteLine,
} from "@/lib/materials/quote-line";
import type { StockEntry } from "@/lib/materials/types";

export default function Cotizador({
  initialEntries,
}: {
  initialEntries: StockEntry[];
}) {
  const products = useMemo(
    () => buildQuoteProductOptions(initialEntries),
    [initialEntries],
  );

  const telaProducts = useMemo(
    () => products.filter((p) => p.materialType === "telas"),
    [products],
  );

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.key, product])),
    [products],
  );

  const [committedLines, setCommittedLines] = useState<CommittedQuoteLine[]>(
    [],
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [lineToEdit, setLineToEdit] = useState<CommittedQuoteLine | null>(null);
  const [pairedFabricLine, setPairedFabricLine] =
    useState<CommittedQuoteLine | null>(null);

  const totalCost = committedLines.reduce(
    (sum, line) =>
      sum + getQuoteLineCost(line, productMap.get(line.productKey)),
    0,
  );

  const removeLinesFromQuote = (ids: Set<string>) => {
    setCommittedLines((current) =>
      current.filter((line) => !ids.has(line.id)),
    );
  };

  const openAddModal = () => {
    setLineToEdit(null);
    setPairedFabricLine(null);
    setModalOpen(true);
  };

  const openEditModal = (line: CommittedQuoteLine) => {
    const paired = findPairedLine(line, committedLines);
    const product = productMap.get(line.productKey);
    const pairedProduct = paired ? productMap.get(paired.productKey) : undefined;

    const isWoodLine = product?.materialType === "maderas";
    const isFabricOfWood =
      paired && pairedProduct?.materialType === "maderas" && product?.materialType === "telas";

    const woodLine = isWoodLine ? line : isFabricOfWood ? paired! : line;
    const fabricLine =
      isWoodLine && paired?.pairRole === "tela"
        ? paired
        : isFabricOfWood
          ? line
          : null;

    const idsToRemove = new Set<string>([line.id]);
    if (paired) idsToRemove.add(paired.id);

    setLineToEdit(woodLine);
    setPairedFabricLine(fabricLine);
    removeLinesFromQuote(idsToRemove);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (lineToEdit) {
      const restore: CommittedQuoteLine[] = [lineToEdit];
      if (pairedFabricLine) restore.push(pairedFabricLine);
      setCommittedLines((current) => [...current, ...restore]);
    }
    setModalOpen(false);
    setLineToEdit(null);
    setPairedFabricLine(null);
  };

  const handleCommit = (lines: CommittedQuoteLine[]) => {
    setCommittedLines((current) => [...current, ...lines]);
    setModalOpen(false);
    setLineToEdit(null);
    setPairedFabricLine(null);
  };

  const removeCommitted = (id: string) => {
    setCommittedLines((current) => {
      const target = current.find((line) => line.id === id);
      if (target?.pairId) {
        return current.filter((line) => line.pairId !== target.pairId);
      }
      return current.filter((line) => line.id !== id);
    });
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
          La cotización se arma en la tabla. Agregá o editá productos desde el
          modal.
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
        <section className="mx-auto w-full max-w-[1000px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Cotización
              {committedLines.length > 0 && (
                <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
                  ({committedLines.length}{" "}
                  {committedLines.length === 1 ? "ítem" : "ítems"})
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-700 px-4 text-sm font-medium text-white transition hover:bg-amber-800"
            >
              Agregar producto
            </button>
          </div>

          <QuoteLinesTable
            lines={committedLines}
            productMap={productMap}
            onEdit={openEditModal}
            onDelete={removeCommitted}
          />

          <div className="mt-6 flex justify-end border-t border-zinc-200 pt-6 dark:border-zinc-800">
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

      <AddQuoteLineDialog
        open={modalOpen}
        lineToEdit={lineToEdit}
        pairedFabricLine={pairedFabricLine}
        products={products}
        telaProducts={telaProducts}
        productMap={productMap}
        onClose={closeModal}
        onCommit={handleCommit}
      />
    </div>
  );
}
