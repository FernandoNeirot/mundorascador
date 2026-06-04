"use client";

import {
  MADERA_ESPESOR_MM,
  type RascadorEnsambleComputed,
} from "@/lib/ensamble/cat-scratcher";

const COLORS = {
  piso: ["#b45309", "#d97706", "#f59e0b", "#fbbf24"],
  columna: "#78716c",
  columnaBase: "#57534e",
  casita: "#7c3aed",
  casitaTecho: "#6d28d9",
  stroke: "#3f3f46",
};

type EnsambleRascadorPreviewProps = {
  computed: RascadorEnsambleComputed;
};

function zToY(zCm: number, alturaTotal: number, viewH: number, bottomPad: number): number {
  return viewH - bottomPad - zCm;
}

export default function EnsambleRascadorPreview({
  computed,
}: EnsambleRascadorPreviewProps) {
  const { niveles, alturaTotalCm } = computed;
  const maxAncho = Math.max(...niveles.map((n) => n.piso.anchoCm), 40);
  const maxLargo = Math.max(...niveles.map((n) => n.piso.largoCm), 30);

  const sidePad = 14;
  const topPad = 12;
  const bottomPad = 18;
  const slabPx = 5;
  const sideViewW = maxAncho + sidePad * 2;
  const sideViewH = alturaTotalCm + topPad + bottomPad + 8;

  const planPad = 16;
  const planW = maxAncho + planPad * 2;
  const planH = maxLargo + planPad * 2;

  const pisoColor = (i: number) => COLORS.piso[i % COLORS.piso.length];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Vista lateral (apilado)
        </h3>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <svg
            viewBox={`0 0 ${sideViewW} ${sideViewH}`}
            className="mx-auto h-auto w-full max-w-md"
            role="img"
            aria-label="Vista lateral apilada del rascador"
          >
            {niveles.map((nivel) => {
              const inferiorAncho =
                nivel.pisoInferior?.anchoCm ?? nivel.piso.anchoCm;
              const inferiorOriginX =
                sidePad + (maxAncho - inferiorAncho) / 2;
              const offsetX = nivel.esBase
                ? sidePad + (maxAncho - nivel.piso.anchoCm) / 2
                : inferiorOriginX +
                  nivel.posicionCm.xCm -
                  nivel.piso.anchoCm / 2;
              const yTop = zToY(nivel.zSuperiorCm, alturaTotalCm, sideViewH, bottomPad);
              const h = Math.max(slabPx, nivel.zSuperiorCm - nivel.zInferiorCm);

              return (
                <g key={nivel.piso.id}>
                  <rect
                    x={offsetX}
                    y={yTop}
                    width={nivel.piso.anchoCm}
                    height={h}
                    fill={pisoColor(nivel.indice)}
                    stroke={COLORS.stroke}
                    strokeWidth={0.5}
                    rx={1}
                  />
                  <text
                    x={offsetX + nivel.piso.anchoCm / 2}
                    y={yTop + h / 2 + 1.5}
                    textAnchor="middle"
                    className="fill-white text-[4.5px] font-medium"
                  >
                    {nivel.piso.etiqueta}
                  </text>
                </g>
              );
            })}

            {niveles.map((nivel) => {
              if (!nivel.tramo) return null;
              const { tramo } = nivel;
              const offsetX = sidePad + (maxAncho - tramo.pisoAnchoCm) / 2;
              const positions = tramo.columnaPosiciones;
              const casitaCol = tramo.soporte.casitaActiva
                ? tramo.casitaColumnaIndice - 1
                : -1;
              const yColBottom = zToY(
                tramo.zInferiorCm,
                alturaTotalCm,
                sideViewH,
                bottomPad,
              );
              const tramoH = tramo.zSuperiorCm - tramo.zInferiorCm;

              return (
                <g key={`tramo-${nivel.piso.id}`}>
                  {positions.map((pos, index) => {
                    const isCasitaCol = index === casitaCol;
                    const w = isCasitaCol && tramo.soporte.casitaActiva
                      ? tramo.soporte.casitaAnchoCm
                      : tramo.soporte.columnaAnchoCm;
                    const x = offsetX + pos.xCm - w / 2;

                    if (isCasitaCol && tramo.soporte.casitaActiva) {
                      const baseH =
                        (tramo.columnaBaseAltoCm / tramo.soporte.columnaAltoCm) *
                        tramoH;
                      const houseH = tramoH - baseH;
                      const houseW = tramo.soporte.casitaAnchoCm;
                      const houseX = offsetX + pos.xCm - houseW / 2;
                      const colW = tramo.soporte.columnaAnchoCm;
                      const colX = offsetX + pos.xCm - colW / 2;
                      const yBaseTop = yColBottom - baseH;

                      return (
                        <g key={`col-${index}`}>
                          <rect
                            x={colX}
                            y={yBaseTop}
                            width={colW}
                            height={baseH}
                            fill={COLORS.columnaBase}
                            stroke={COLORS.stroke}
                            strokeWidth={0.35}
                          />
                          <rect
                            x={houseX}
                            y={yBaseTop - houseH}
                            width={houseW}
                            height={houseH}
                            fill={COLORS.casita}
                            stroke={COLORS.stroke}
                            strokeWidth={0.4}
                            opacity={0.92}
                          />
                          <polygon
                            points={`${houseX},${yBaseTop - houseH} ${houseX + houseW / 2},${yBaseTop - houseH - 5} ${houseX + houseW},${yBaseTop - houseH}`}
                            fill={COLORS.casitaTecho}
                            stroke={COLORS.stroke}
                            strokeWidth={0.35}
                          />
                        </g>
                      );
                    }

                    return (
                      <rect
                        key={`col-${index}`}
                        x={x}
                        y={yColBottom - tramoH}
                        width={w}
                        height={tramoH}
                        fill={COLORS.columna}
                        stroke={COLORS.stroke}
                        strokeWidth={0.35}
                      />
                    );
                  })}
                </g>
              );
            })}

            <text
              x={sideViewW / 2}
              y={sideViewH - 4}
              textAnchor="middle"
              className="fill-zinc-500 text-[5px]"
            >
              Altura total ≈ {alturaTotalCm.toFixed(1)} cm · madera {MADERA_ESPESOR_MM} mm
            </text>
          </svg>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
          Vista superior (pisos)
        </h3>
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <svg
            viewBox={`0 0 ${planW} ${planH}`}
            className="mx-auto h-auto w-full max-w-md"
            role="img"
            aria-label="Vista superior de pisos"
          >
            {niveles.map((nivel) => {
              let offsetX = planPad + (maxAncho - nivel.piso.anchoCm) / 2;
              let offsetY = planPad + (maxLargo - nivel.piso.largoCm) / 2;
              if (!nivel.esBase && nivel.pisoInferior) {
                const inf = nivel.pisoInferior;
                const infOX = planPad + (maxAncho - inf.anchoCm) / 2;
                const infOY = planPad + (maxLargo - inf.largoCm) / 2;
                offsetX = infOX + nivel.posicionCm.xCm - nivel.piso.anchoCm / 2;
                offsetY = infOY + nivel.posicionCm.yCm - nivel.piso.largoCm / 2;
              }

              return (
                <rect
                  key={`plan-piso-${nivel.piso.id}`}
                  x={offsetX}
                  y={offsetY}
                  width={nivel.piso.anchoCm}
                  height={nivel.piso.largoCm}
                  fill={pisoColor(nivel.indice)}
                  fillOpacity={0.25 + nivel.indice * 0.08}
                  stroke={pisoColor(nivel.indice)}
                  strokeWidth={1}
                  rx={2}
                />
              );
            })}

            {niveles.map((nivel) => {
              if (!nivel.tramo) return null;
              const host = nivel.piso;

              const offsetX = planPad + (maxAncho - host.anchoCm) / 2;
              const offsetY = planPad + (maxLargo - host.largoCm) / 2;
              const positions = nivel.tramo.columnaPosiciones;
              const casitaCol = nivel.tramo.soporte.casitaActiva
                ? nivel.tramo.casitaColumnaIndice - 1
                : -1;

              return (
                <g key={`plan-tramo-${nivel.piso.id}`}>
                  {positions.map((pos, index) => {
                    const isCasitaCol = index === casitaCol;
                    const w =
                      isCasitaCol && nivel.tramo!.soporte.casitaActiva
                        ? nivel.tramo!.soporte.casitaAnchoCm
                        : nivel.tramo!.soporte.columnaAnchoCm;
                    const d =
                      isCasitaCol && nivel.tramo!.soporte.casitaActiva
                        ? nivel.tramo!.soporte.casitaProfundoCm
                        : nivel.tramo!.soporte.columnaProfundoCm;
                    const x = offsetX + pos.xCm - w / 2;
                    const y = offsetY + pos.yCm - d / 2;

                    return (
                      <rect
                        key={`plan-col-${index}`}
                        x={x}
                        y={y}
                        width={w}
                        height={d}
                        fill={
                          isCasitaCol && nivel.tramo!.soporte.casitaActiva
                            ? COLORS.casita
                            : COLORS.columna
                        }
                        fillOpacity={0.75}
                        stroke={COLORS.stroke}
                        strokeWidth={0.4}
                        rx={1}
                      />
                    );
                  })}
                  <text
                    x={offsetX + host.anchoCm / 2}
                    y={offsetY - 3}
                    textAnchor="middle"
                    className="fill-zinc-600 text-[4px] dark:fill-zinc-400"
                  >
                    ↑ {nivel.tramo.pisoArribaEtiqueta} (columnas en {host.etiqueta})
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Cada rectángulo es un piso (con su posición X/Y en el de abajo); los
          cuadrados son columnas o casita en el piso inferior.
        </p>
      </div>
    </div>
  );
}
