"use client";

import type {
  OptimizerMaterialType,
  PackResult,
} from "@/lib/materials/cut-optimizer";

const CUT_COLORS = [
  "#d97706",
  "#b45309",
  "#92400e",
  "#78350f",
  "#f59e0b",
  "#fb923c",
];

const FABRIC_COLORS = [
  "#7c3aed",
  "#6d28d9",
  "#5b21b6",
  "#4c1d95",
  "#8b5cf6",
  "#a78bfa",
];

type CutLayoutPreviewProps = {
  result: PackResult;
  materialType: OptimizerMaterialType;
};

function toPercent(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

export default function CutLayoutPreview({
  result,
  materialType,
}: CutLayoutPreviewProps) {
  const palette =
    materialType === "maderas" ? CUT_COLORS : FABRIC_COLORS;

  const { sheetAnchoCm, sheetLargoCm } = result;

  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="w-full min-w-0">
        <div
          className="relative w-full max-w-full border-2 border-zinc-400 bg-zinc-100 shadow-inner dark:border-zinc-600 dark:bg-zinc-900"
          style={{
            aspectRatio: `${sheetAnchoCm} / ${sheetLargoCm}`,
          }}
          role="img"
          aria-label={`Simulación de placa ${sheetAnchoCm} por ${sheetLargoCm} centímetros con ${result.placed.length} cortes`}
        >
          <div className="pointer-events-none absolute left-1 top-1 max-w-[calc(100%-0.5rem)] truncate rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 shadow sm:left-2 sm:top-2 sm:px-2 sm:py-1 sm:text-xs dark:bg-zinc-950/90 dark:text-zinc-300">
            {sheetAnchoCm} × {sheetLargoCm} cm
          </div>

          {result.placed.map((cut, index) => {
            const color = palette[index % palette.length];
            const innerWidthPercent =
              (cut.anchoCm / cut.footprintAnchoCm) * 100;
            const innerHeightPercent =
              (cut.largoCm / cut.footprintLargoCm) * 100;

            return (
              <div
                key={cut.placementId}
                className="absolute box-border border border-dashed border-zinc-500/50"
                style={{
                  left: toPercent(cut.x, sheetAnchoCm),
                  top: toPercent(cut.y, sheetLargoCm),
                  width: toPercent(cut.footprintAnchoCm, sheetAnchoCm),
                  height: toPercent(cut.footprintLargoCm, sheetLargoCm),
                }}
                title={`${cut.label}: ${cut.anchoCm}×${cut.largoCm} cm${cut.rotated ? " (rotado)" : ""}`}
              >
                <div
                  className="absolute left-0 top-0 flex flex-col items-center justify-center overflow-hidden px-0.5 text-center font-medium leading-tight text-white shadow-sm"
                  style={{
                    width: `${innerWidthPercent}%`,
                    height: `${innerHeightPercent}%`,
                    backgroundColor: color,
                    fontSize: "clamp(6px, 2.5vw, 10px)",
                  }}
                >
                  <span className="hidden max-w-full truncate sm:inline">
                    {cut.label}
                  </span>
                  <span className="max-w-full truncate opacity-90">
                    {cut.anchoCm}×{cut.largoCm}
                  </span>
                  {cut.rotated && (
                    <span className="text-[8px] opacity-80 sm:text-[9px]">
                      ↻
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {result.wasteCm2 > 0 && (
            <div className="pointer-events-none absolute bottom-1 right-1 max-w-[calc(100%-0.5rem)] truncate rounded bg-white/90 px-1.5 py-0.5 text-[10px] text-zinc-600 shadow sm:bottom-2 sm:right-2 sm:px-2 sm:py-1 sm:text-xs dark:bg-zinc-950/90 dark:text-zinc-400">
              Desp.: {Math.round(result.wasteCm2).toLocaleString("es-AR")} cm²
            </div>
          )}
        </div>
      </div>

      <ul className="grid min-w-0 gap-2 sm:grid-cols-2">
        {result.placed.map((cut, index) => (
          <li
            key={cut.placementId}
            className="flex min-w-0 items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs dark:border-zinc-800"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: palette[index % palette.length] }}
            />
            <span className="min-w-0 break-words text-zinc-800 dark:text-zinc-200">
              {cut.label} · {cut.anchoCm}×{cut.largoCm} cm
              {cut.rotated ? " · rotado" : ""} · pos ({cut.x.toFixed(1)},{" "}
              {cut.y.toFixed(1)})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
