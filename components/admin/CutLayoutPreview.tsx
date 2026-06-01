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

export default function CutLayoutPreview({
  result,
  materialType,
}: CutLayoutPreviewProps) {
  const palette =
    materialType === "maderas" ? CUT_COLORS : FABRIC_COLORS;

  const maxDisplayWidth = 640;
  const scale = maxDisplayWidth / result.sheetAnchoCm;
  const displayWidth = result.sheetAnchoCm * scale;
  const displayHeight = result.sheetLargoCm * scale;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <div
          className="relative mx-auto border-2 border-zinc-400 bg-zinc-100 shadow-inner dark:border-zinc-600 dark:bg-zinc-900"
          style={{
            width: `${displayWidth}px`,
            height: `${displayHeight}px`,
            maxWidth: "100%",
          }}
          role="img"
          aria-label={`Simulación de placa ${result.sheetAnchoCm} por ${result.sheetLargoCm} centímetros con ${result.placed.length} cortes`}
        >
          <div className="pointer-events-none absolute left-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-medium text-zinc-700 shadow dark:bg-zinc-950/90 dark:text-zinc-300">
            {result.sheetAnchoCm} × {result.sheetLargoCm} cm
          </div>

          {result.placed.map((cut, index) => {
            const innerWidth = cut.anchoCm * scale;
            const innerHeight = cut.largoCm * scale;
            const footprintWidth = cut.footprintAnchoCm * scale;
            const footprintHeight = cut.footprintLargoCm * scale;
            const color = palette[index % palette.length];

            return (
              <div
                key={cut.placementId}
                className="absolute box-border border border-dashed border-zinc-500/50"
                style={{
                  left: `${cut.x * scale}px`,
                  top: `${cut.y * scale}px`,
                  width: `${footprintWidth}px`,
                  height: `${footprintHeight}px`,
                }}
                title={`${cut.label}: ${cut.anchoCm}×${cut.largoCm} cm${cut.rotated ? " (rotado)" : ""}`}
              >
                <div
                  className="absolute left-0 top-0 flex flex-col items-center justify-center overflow-hidden px-0.5 text-center text-[10px] font-medium leading-tight text-white shadow-sm"
                  style={{
                    width: `${innerWidth}px`,
                    height: `${innerHeight}px`,
                    backgroundColor: color,
                  }}
                >
                  <span className="truncate max-w-full">{cut.label}</span>
                  <span className="opacity-90">
                    {cut.anchoCm}×{cut.largoCm}
                  </span>
                  {cut.rotated && (
                    <span className="text-[9px] opacity-80">↻</span>
                  )}
                </div>
              </div>
            );
          })}

          {result.wasteCm2 > 0 && (
            <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-xs text-zinc-600 shadow dark:bg-zinc-950/90 dark:text-zinc-400">
              Desperdicio: {Math.round(result.wasteCm2).toLocaleString("es-AR")}{" "}
              cm²
            </div>
          )}
        </div>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {result.placed.map((cut, index) => (
          <li
            key={cut.placementId}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs dark:border-zinc-800"
          >
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: palette[index % palette.length] }}
            />
            <span className="text-zinc-800 dark:text-zinc-200">
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
