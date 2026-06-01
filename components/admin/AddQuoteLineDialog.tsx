"use client";

import { useEffect, useState } from "react";
import CollapsibleProductDetails from "@/components/admin/CollapsibleProductDetails";
import type { CommittedQuoteLine } from "@/lib/materials/quote-line";
import QuoteCutInputs from "@/components/admin/QuoteCutInputs";
import WoodFabricSuggestion, {
  emptyWoodFabricDraft,
  type WoodFabricDraft,
} from "@/components/admin/WoodFabricSuggestion";
import { formatPrice } from "@/lib/materials/format";
import {
  getQuoteLineCost,
  isQuoteLineCommittable,
  usesCutBasedQuantity,
} from "@/lib/materials/quote-line";
import type { QuoteProductOption } from "@/lib/materials/quote-products";
import { suggestedFabricCutForWood } from "@/lib/materials/wood-fabric-quote";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300";

const readOnlyInputClassName = `${inputClassName} cursor-not-allowed bg-zinc-50 dark:bg-zinc-900/60`;

type QuoteLineDraft = CommittedQuoteLine & {
  woodFabric: WoodFabricDraft;
};

function emptyLine(
  products: QuoteProductOption[],
  telaProducts: QuoteProductOption[],
): QuoteLineDraft {
  return {
    id: crypto.randomUUID(),
    productKey: products[0]?.key ?? "",
    cutAnchoCm: "",
    cutLargoCm: "",
    pieceCount: "1",
    quantityUsed: "",
    woodFabric: emptyWoodFabricDraft(telaProducts),
  };
}

function syncWoodFabricFromCut(
  woodFabric: WoodFabricDraft,
  cutAnchoCm: string,
  cutLargoCm: string,
): WoodFabricDraft {
  const next: WoodFabricDraft = {
    ...woodFabric,
    woodAnchoCm: cutAnchoCm,
    woodLargoCm: cutLargoCm,
  };

  if (next.fabricDimsEdited) return next;

  const ancho = Number(cutAnchoCm);
  const largo = Number(cutLargoCm);
  if (
    !Number.isFinite(ancho) ||
    ancho <= 0 ||
    !Number.isFinite(largo) ||
    largo <= 0
  ) {
    return next;
  }

  const suggestion = suggestedFabricCutForWood(ancho, largo);
  next.fabricAnchoCm = String(suggestion.anchoCm);
  next.fabricLargoCm = String(suggestion.largoCm);
  return next;
}

function lineToDraft(
  line: CommittedQuoteLine,
  pairedFabricLine: CommittedQuoteLine | null,
  telaProducts: QuoteProductOption[],
  product?: QuoteProductOption,
): QuoteLineDraft {
  if (product?.materialType === "maderas" && pairedFabricLine) {
    const woodFabric: WoodFabricDraft = {
      ...emptyWoodFabricDraft(telaProducts),
      woodAnchoCm: line.cutAnchoCm,
      woodLargoCm: line.cutLargoCm,
      fabricProductKey: pairedFabricLine.productKey,
      fabricAnchoCm: pairedFabricLine.cutAnchoCm,
      fabricLargoCm: pairedFabricLine.cutLargoCm,
      fabricDimsEdited: true,
      fabricConfirmed: true,
    };
    return { ...line, woodFabric };
  }

  const woodFabric =
    product?.materialType === "maderas"
      ? syncWoodFabricFromCut(
          emptyWoodFabricDraft(telaProducts),
          line.cutAnchoCm,
          line.cutLargoCm,
        )
      : emptyWoodFabricDraft(telaProducts);

  return { ...line, woodFabric };
}

function toCommitted(line: QuoteLineDraft): CommittedQuoteLine {
  const { woodFabric: _woodFabric, ...committed } = line;
  return committed;
}

function buildFabricLineFromDraft(
  draft: WoodFabricDraft,
): Omit<CommittedQuoteLine, "id" | "pairId" | "pairRole"> | null {
  const fabricLine = {
    productKey: draft.fabricProductKey,
    cutAnchoCm: draft.fabricAnchoCm,
    cutLargoCm: draft.fabricLargoCm,
    pieceCount: "1",
    quantityUsed: "",
  };

  return fabricLine;
}

type AddQuoteLineDialogProps = {
  open: boolean;
  lineToEdit: CommittedQuoteLine | null;
  pairedFabricLine: CommittedQuoteLine | null;
  products: QuoteProductOption[];
  telaProducts: QuoteProductOption[];
  productMap: Map<string, QuoteProductOption>;
  onClose: () => void;
  onCommit: (lines: CommittedQuoteLine[]) => void;
};

export default function AddQuoteLineDialog({
  open,
  lineToEdit,
  pairedFabricLine,
  products,
  telaProducts,
  productMap,
  onClose,
  onCommit,
}: AddQuoteLineDialogProps) {
  const [draft, setDraft] = useState<QuoteLineDraft>(() =>
    emptyLine(products, telaProducts),
  );
  const [commitError, setCommitError] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [expandedWoodFabric, setExpandedWoodFabric] = useState(false);

  useEffect(() => {
    if (!open) return;

    setCommitError(null);
    setExpandedDetails(false);
    setExpandedWoodFabric(false);

    if (lineToEdit) {
      setDraft(
        lineToDraft(
          lineToEdit,
          pairedFabricLine,
          telaProducts,
          productMap.get(lineToEdit.productKey),
        ),
      );
      if (
        pairedFabricLine ||
        productMap.get(lineToEdit.productKey)?.materialType === "maderas"
      ) {
        setExpandedWoodFabric(true);
      }
      return;
    }

    setDraft(emptyLine(products, telaProducts));
  }, [open, lineToEdit, pairedFabricLine, products, telaProducts, productMap]);

  const draftProduct = productMap.get(draft.productKey);
  const draftCost = getQuoteLineCost(draft, draftProduct);
  const isMadera = draftProduct?.materialType === "maderas";
  const useCut = usesCutBasedQuantity(draftProduct);

  const fabricDraftCost =
    draft.woodFabric.fabricConfirmed && draft.woodFabric.fabricProductKey
      ? getQuoteLineCost(
          {
            cutAnchoCm: draft.woodFabric.fabricAnchoCm,
            cutLargoCm: draft.woodFabric.fabricLargoCm,
            pieceCount: "1",
            quantityUsed: "",
          },
          productMap.get(draft.woodFabric.fabricProductKey),
        )
      : 0;

  const combinedCost = draftCost + fabricDraftCost;

  const updateDraft = (patch: Partial<QuoteLineDraft>) => {
    setCommitError(null);
    setDraft((current) => {
      let next = { ...current, ...patch };
      const product = productMap.get(next.productKey);

      if (
        patch.productKey !== undefined &&
        product?.materialType !== "maderas"
      ) {
        next.woodFabric = emptyWoodFabricDraft(telaProducts);
      }

      if (product?.materialType === "maderas") {
        if (patch.cutAnchoCm !== undefined || patch.cutLargoCm !== undefined) {
          next.woodFabric = syncWoodFabricFromCut(
            next.woodFabric,
            next.cutAnchoCm,
            next.cutLargoCm,
          );
        }
        if (patch.woodFabric !== undefined) {
          next.cutAnchoCm = patch.woodFabric.woodAnchoCm;
          next.cutLargoCm = patch.woodFabric.woodLargoCm;
        }
      }

      return next;
    });
  };

  const handleCommit = () => {
    const product = productMap.get(draft.productKey);
    if (!isQuoteLineCommittable(draft, product)) {
      setCommitError(
        "Completá el producto y la cantidad o corte antes de agregar.",
      );
      return;
    }

    const woodLine: CommittedQuoteLine = { ...toCommitted(draft) };
    const lines: CommittedQuoteLine[] = [woodLine];

    if (isMadera && draft.woodFabric.fabricConfirmed) {
      const fabricPayload = buildFabricLineFromDraft(draft.woodFabric);
      const fabricProduct = fabricPayload
        ? productMap.get(fabricPayload.productKey)
        : undefined;

      if (!fabricPayload || !isQuoteLineCommittable(fabricPayload, fabricProduct)) {
        setCommitError("La tela incluida no tiene medidas válidas.");
        return;
      }

      const pairId = lineToEdit?.pairId ?? crypto.randomUUID();
      woodLine.pairId = pairId;
      woodLine.pairRole = "madera";

      lines.push({
        id: pairedFabricLine?.id ?? crypto.randomUUID(),
        ...fabricPayload,
        pairId,
        pairRole: "tela",
      });
    }

    onCommit(lines);
  };

  if (!open) return null;

  const title = lineToEdit ? "Editar producto" : "Agregar producto";
  const commitLabel =
    isMadera && draft.woodFabric.fabricConfirmed
      ? lineToEdit
        ? "Guardar madera y tela"
        : "Agregar madera y tela"
      : lineToEdit
        ? "Guardar cambios"
        : "Agregar a la cotización";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-line-dialog-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h3
              id="quote-line-dialog-title"
              className="text-lg font-medium text-zinc-900 dark:text-zinc-50"
            >
              {title}
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Elegí el producto, el corte y confirmá para sumarlo a la cotización.
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

        <div className="flex flex-col gap-4">
          <label className={labelClassName}>
            Producto
            <select
              value={draft.productKey}
              onChange={(event) =>
                updateDraft({ productKey: event.target.value })
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

          {draftProduct && (
            <CollapsibleProductDetails
              product={draftProduct}
              expanded={expandedDetails}
              onToggle={() => setExpandedDetails((v) => !v)}
              formatPrice={formatPrice}
            />
          )}

          {useCut ? (
            <QuoteCutInputs
              anchoCm={draft.cutAnchoCm}
              largoCm={draft.cutLargoCm}
              pieceCount={draft.pieceCount}
              showPieceCount={isMadera}
              onAnchoChange={(value) => updateDraft({ cutAnchoCm: value })}
              onLargoChange={(value) => updateDraft({ cutLargoCm: value })}
              onPieceCountChange={
                isMadera
                  ? (value) => updateDraft({ pieceCount: value })
                  : undefined
              }
            />
          ) : (
            <label className={labelClassName}>
              Cantidad usada
              <input
                type="number"
                min="0.01"
                step="any"
                value={draft.quantityUsed}
                onChange={(event) =>
                  updateDraft({ quantityUsed: event.target.value })
                }
                placeholder="0"
                className={inputClassName}
              />
            </label>
          )}

          <label className={labelClassName}>
            Costo{draft.woodFabric.fabricConfirmed ? " (madera + tela)" : ""}
            <input
              type="text"
              readOnly
              value={
                combinedCost > 0
                  ? formatPrice(combinedCost)
                  : draftCost > 0
                    ? formatPrice(draftCost)
                    : "—"
              }
              className={readOnlyInputClassName}
            />
          </label>

          {isMadera && (
            <div className="rounded-lg border border-amber-600/30 dark:border-amber-600/20">
              <button
                type="button"
                onClick={() => setExpandedWoodFabric((v) => !v)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-amber-50/50 dark:hover:bg-amber-950/20"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  Tela para tapizar
                  {draft.woodFabric.fabricConfirmed && (
                    <span className="ml-2 text-xs font-normal text-emerald-700 dark:text-emerald-400">
                      · incluida
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs font-medium text-amber-700 dark:text-amber-400">
                  {expandedWoodFabric ? "Ocultar" : "Calcular tela"}
                </span>
              </button>
              {expandedWoodFabric && (
                <div className="border-t border-amber-600/20 p-3 dark:border-amber-600/10">
                  <WoodFabricSuggestion
                    telaProducts={telaProducts}
                    draft={draft.woodFabric}
                    onDraftChange={(woodFabric) => updateDraft({ woodFabric })}
                  />
                </div>
              )}
            </div>
          )}

          {commitError && (
            <p className="text-sm text-red-600 dark:text-red-400">{commitError}</p>
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
              type="button"
              onClick={handleCommit}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-700 px-4 text-sm font-medium text-white transition hover:bg-amber-800"
            >
              {commitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
