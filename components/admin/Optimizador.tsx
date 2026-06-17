"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CutLayoutPreview from "@/components/admin/CutLayoutPreview";
import {
  optimizeCutLayout,
  type CutRequest,
  type OptimizerMaterialType,
} from "@/lib/materials/cut-optimizer";
import { KERF_CM_PER_SIDE } from "@/lib/materials/cortes";
import { formatSuperficieCm2 } from "@/lib/materials/superficie";
import {
  FABRIC_LATERAL_OVERHANG_CM,
  suggestedFabricCutForWood,
} from "@/lib/materials/wood-fabric-quote";
import { useTenantPaths } from "@/lib/tenant/context";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300";

type DraftCut = {
  id: string;
  anchoCm: string;
  largoCm: string;
  quantity: string;
  /** En modo tela: medidas de la pieza de madera a tapizar. */
  isWoodMeasure: boolean;
};

const emptyDraftCut = (isWoodMeasure = false): DraftCut => ({
  id: crypto.randomUUID(),
  anchoCm: "",
  largoCm: "",
  quantity: "1",
  isWoodMeasure,
});

function getFabricSuggestionFromWood(
  anchoCm: string,
  largoCm: string,
): ReturnType<typeof suggestedFabricCutForWood> | null {
  const woodAncho = Number(anchoCm);
  const woodLargo = Number(largoCm);
  if (
    !Number.isFinite(woodAncho) ||
    woodAncho <= 0 ||
    !Number.isFinite(woodLargo) ||
    woodLargo <= 0
  ) {
    return null;
  }
  return suggestedFabricCutForWood(woodAncho, woodLargo);
}

function FabricWoodSuggestion({ anchoCm, largoCm }: { anchoCm: string; largoCm: string }) {
  const suggestion = getFabricSuggestionFromWood(anchoCm, largoCm);
  if (!suggestion) {
    return (
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Ingresá ancho y largo de madera para ver el corte de tela sugerido.
      </p>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2.5 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
      <p className="font-medium">Tela sugerida</p>
      <p className="mt-0.5 tabular-nums">
        {suggestion.anchoCm} × {suggestion.largoCm} cm
        <span className="ml-1 font-normal text-emerald-800/80 dark:text-emerald-300/80">
          ({formatSuperficieCm2(suggestion.superficieCm2)})
        </span>
      </p>
      <p className="mt-1 text-xs text-emerald-800/90 dark:text-emerald-300/90">
        Cubre arriba y abajo: largo = madera × 2 + {FABRIC_LATERAL_OVERHANG_CM * 2}{" "}
        cm; ancho = madera + {FABRIC_LATERAL_OVERHANG_CM * 2} cm.
      </p>
    </div>
  );
}

function parseCuts(
  drafts: DraftCut[],
  materialType: OptimizerMaterialType,
): CutRequest[] {
  return drafts.flatMap((draft, index) => {
    const inputAncho = Number(draft.anchoCm);
    const inputLargo = Number(draft.largoCm);
    const quantity = Math.max(1, Math.floor(Number(draft.quantity) || 1));

    if (
      !Number.isFinite(inputAncho) ||
      inputAncho <= 0 ||
      !Number.isFinite(inputLargo) ||
      inputLargo <= 0
    ) {
      return [];
    }

    const useWoodToFabric =
      materialType === "telas" && draft.isWoodMeasure;
    const fabric = useWoodToFabric
      ? suggestedFabricCutForWood(inputAncho, inputLargo)
      : null;
    const anchoCm = fabric?.anchoCm ?? inputAncho;
    const largoCm = fabric?.largoCm ?? inputLargo;

    const woodLabel =
      useWoodToFabric && fabric
        ? ` (madera ${inputAncho}×${inputLargo} → tela ${fabric.anchoCm}×${fabric.largoCm})`
        : "";

    return [
      {
        id: draft.id,
        anchoCm,
        largoCm,
        quantity,
        label: `Corte ${index + 1}${woodLabel}`,
      },
    ];
  });
}

export default function Optimizador() {
  const { basePath } = useTenantPaths();
  const [materialType, setMaterialType] =
    useState<OptimizerMaterialType>("maderas");
  const [sheetAnchoCm, setSheetAnchoCm] = useState("");
  const [sheetLargoCm, setSheetLargoCm] = useState("");
  const [allowRotation, setAllowRotation] = useState(true);
  const [draftCuts, setDraftCuts] = useState<DraftCut[]>([
    emptyDraftCut(false),
  ]);

  const sheetAncho = Number(sheetAnchoCm);
  const sheetLargo = Number(sheetLargoCm);
  const sheetValid =
    Number.isFinite(sheetAncho) &&
    sheetAncho > 0 &&
    Number.isFinite(sheetLargo) &&
    sheetLargo > 0;

  const cuts = useMemo(
    () => parseCuts(draftCuts, materialType),
    [draftCuts, materialType],
  );

  const result = useMemo(() => {
    if (!sheetValid || cuts.length === 0) return null;
    return optimizeCutLayout({
      sheetAnchoCm: sheetAncho,
      sheetLargoCm: sheetLargo,
      cuts,
      allowRotation,
    });
  }, [sheetValid, sheetAncho, sheetLargo, cuts, allowRotation]);

  const updateDraftCut = (id: string, patch: Partial<DraftCut>) => {
    setDraftCuts((current) =>
      current.map((cut) => (cut.id === id ? { ...cut, ...patch } : cut)),
    );
  };

  const setMaterialTypeAndCuts = (next: OptimizerMaterialType) => {
    setMaterialType(next);
    setDraftCuts((current) =>
      current.map((cut) => ({
        ...cut,
        isWoodMeasure: next === "telas",
      })),
    );
  };

  const addDraftCut = () => {
    setDraftCuts((current) => [
      ...current,
      emptyDraftCut(materialType === "telas"),
    ]);
  };

  const removeDraftCut = (id: string) => {
    setDraftCuts((current) =>
      current.length <= 1 ? current : current.filter((cut) => cut.id !== id),
    );
  };

  const materialLabel = materialType === "maderas" ? "Madera" : "Tela";

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <Link
          href={basePath}
          className="text-sm font-medium text-amber-700 transition hover:text-amber-800 dark:text-amber-400"
        >
          ← Volver al panel
        </Link>
        <p className="mt-4 text-sm font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Administración
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Optimizador de cortes
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Cargá la placa y los cortes para simular cómo ubicarlos y reducir el
          desperdicio. Se suma {KERF_CM_PER_SIDE} cm de kerf entre cortes (no en
          el borde de la placa cuando el corte usa todo el ancho o largo). En
          modo tela, si el corte es medida de madera, se propone el recorte que
          cubre arriba y abajo (+{FABRIC_LATERAL_OVERHANG_CM} cm por lado).
        </p>
      </header>

      <div className="mx-auto flex w-full min-w-0 max-w-[1000px] flex-col gap-6">
        <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Configuración
          </h2>

          <div className="flex flex-col gap-4">
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Tipo de material
              </legend>
              <div className="flex gap-2">
                {(
                  [
                    ["maderas", "Madera"],
                    ["telas", "Tela"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMaterialTypeAndCuts(value)}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                      materialType === value
                        ? "border-amber-600 bg-amber-50 text-amber-900 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-200"
                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className={labelClassName}>
                Placa — ancho (cm)
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={sheetAnchoCm}
                  onChange={(event) => setSheetAnchoCm(event.target.value)}
                  placeholder="Ej. 122"
                  className={inputClassName}
                />
              </label>
              <label className={labelClassName}>
                Placa — largo (cm)
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={sheetLargoCm}
                  onChange={(event) => setSheetLargoCm(event.target.value)}
                  placeholder="Ej. 244"
                  className={inputClassName}
                />
              </label>
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={allowRotation}
                onChange={(event) => setAllowRotation(event.target.checked)}
                className="rounded border-zinc-300 text-amber-700 focus:ring-amber-600"
              />
              Permitir rotar cortes 90°
            </label>

            {materialType === "telas" && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                Con medida de madera, la tela debe cubrir ambos lados: se suman{" "}
                {FABRIC_LATERAL_OVERHANG_CM} cm por lado (espesor + agarre). Ej.:
                madera 50×40 cm → tela 60×90 cm.
              </p>
            )}

            <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  Cortes
                </p>
                <button
                  type="button"
                  onClick={addDraftCut}
                  className="text-xs font-medium text-amber-700 transition hover:text-amber-800 dark:text-amber-400"
                >
                  + Agregar corte
                </button>
              </div>

              <ul className="flex flex-col gap-3">
                {draftCuts.map((cut, index) => (
                  <li
                    key={cut.id}
                    className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Corte {index + 1}
                      </span>
                      {draftCuts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDraftCut(cut.id)}
                          className="text-xs font-medium text-red-600 dark:text-red-400"
                        >
                          Quitar
                        </button>
                      )}
                    </div>
                    {materialType === "telas" && (
                      <label className="mb-3 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                        <input
                          type="checkbox"
                          checked={cut.isWoodMeasure}
                          onChange={(event) =>
                            updateDraftCut(cut.id, {
                              isWoodMeasure: event.target.checked,
                            })
                          }
                          className="rounded border-zinc-300 text-amber-700 focus:ring-amber-600"
                        />
                        La medida ingresada es de madera (tapizado arriba y abajo)
                      </label>
                    )}

                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className={labelClassName}>
                        {cut.isWoodMeasure && materialType === "telas"
                          ? "Madera — ancho"
                          : "Ancho"}
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={cut.anchoCm}
                          onChange={(event) =>
                            updateDraftCut(cut.id, {
                              anchoCm: event.target.value,
                            })
                          }
                          className={inputClassName}
                        />
                      </label>
                      <label className={labelClassName}>
                        {cut.isWoodMeasure && materialType === "telas"
                          ? "Madera — largo"
                          : "Largo"}
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          value={cut.largoCm}
                          onChange={(event) =>
                            updateDraftCut(cut.id, {
                              largoCm: event.target.value,
                            })
                          }
                          className={inputClassName}
                        />
                      </label>
                      <label className={labelClassName}>
                        Cant.
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={cut.quantity}
                          onChange={(event) =>
                            updateDraftCut(cut.id, {
                              quantity: event.target.value,
                            })
                          }
                          className={inputClassName}
                        />
                      </label>
                    </div>

                    {materialType === "telas" && cut.isWoodMeasure && (
                      <FabricWoodSuggestion
                        anchoCm={cut.anchoCm}
                        largoCm={cut.largoCm}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Simulación · {materialLabel}
          </h2>

          {!sheetValid || cuts.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Completá el tamaño de la placa y al menos un corte válido para ver
              la simulación.
            </p>
          ) : result ? (
            <div className="flex flex-col gap-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Aprovechamiento
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {result.efficiencyPercent.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Desperdicio
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {formatSuperficieCm2(result.wasteCm2)}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
                  <p className="text-xs uppercase tracking-wider text-zinc-500">
                    Colocados
                  </p>
                  <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {result.placed.length}
                    {result.unplaced.length > 0 && (
                      <span className="ml-1 text-sm font-normal text-red-600 dark:text-red-400">
                        · faltan{" "}
                        {result.unplaced.reduce((s, c) => s + c.quantity, 0)}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {result.unplaced.length > 0 && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
                >
                  No entraron todos los cortes en esta placa. Agregá otra placa o
                  reducí cantidades.
                </div>
              )}

              <CutLayoutPreview result={result} materialType={materialType} />

              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                El borde punteado reserva espacio para kerf entre cortes. El
                rectángulo sólido es el corte útil. La simulación usa un
                algoritmo de empaquetado 2D con rotación opcional; probá rotar
                cortes o reordenar cantidades para mejorar el resultado.
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
