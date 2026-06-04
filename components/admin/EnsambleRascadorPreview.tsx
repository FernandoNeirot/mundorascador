"use client";

import {
  MADERA_ESPESOR_CM,
  MADERA_ESPESOR_MM,
  type CasitaComputada,
  type RascadorEnsambleComputed,
} from "@/lib/ensamble/cat-scratcher";

const COLORS = {
  piso: ["#b45309", "#d97706", "#f59e0b", "#fbbf24"],
  columna: "#78716c",
  columnaBase: "#57534e",
  casita: "#7c3aed",
  casitaTecho: "#6d28d9",
  casitaInterior: "#ede9fe",
  stroke: "#3f3f46",
};

type EnsambleRascadorPreviewProps = {
  computed: RascadorEnsambleComputed;
};

function zToY(zCm: number, alturaTotal: number, viewH: number, bottomPad: number): number {
  return viewH - bottomPad - zCm;
}

function hostOrigin(
  maxAncho: number,
  maxLargo: number,
  pad: number,
  anchoCm: number,
  largoCm: number,
): { ox: number; oy: number } {
  return {
    ox: pad + (maxAncho - anchoCm) / 2,
    oy: pad + (maxLargo - largoCm) / 2,
  };
}

/** Casita con paredes de MADERA_ESPESOR_CM (15 mm) visibles en el dibujo. */
function CasitaSideView({
  casita,
  hostOX,
  alturaTotalCm,
  sideViewH,
  bottomPad,
}: {
  casita: CasitaComputada;
  hostOX: number;
  alturaTotalCm: number;
  sideViewH: number;
  bottomPad: number;
}) {
  const e = MADERA_ESPESOR_CM;
  const W = casita.config.anchoCm;
  const H = casita.config.altoCm;
  const x0 = hostOX + casita.posicionCm.xCm - W / 2;
  const yTop = zToY(casita.zCuerpoSuperiorCm, alturaTotalCm, sideViewH, bottomPad);
  const yBottom = zToY(casita.zInferiorCm, alturaTotalCm, sideViewH, bottomPad);
  const bodyH = yBottom - yTop;
  const yTechoTop = zToY(casita.zTechoSuperiorCm, alturaTotalCm, sideViewH, bottomPad);
  const techoH = yTop - yTechoTop;
  const innerW = Math.max(0, W - 2 * e);
  const innerH = Math.max(0, H - e);

  return (
    <g>
      <rect
        x={x0}
        y={yTop}
        width={W}
        height={bodyH}
        fill="none"
        stroke={COLORS.stroke}
        strokeWidth={0.45}
      />
      <rect
        x={x0}
        y={yTop}
        width={e}
        height={bodyH}
        fill={COLORS.casita}
        stroke={COLORS.stroke}
        strokeWidth={0.35}
      />
      <rect
        x={x0 + W - e}
        y={yTop}
        width={e}
        height={bodyH}
        fill={COLORS.casita}
        stroke={COLORS.stroke}
        strokeWidth={0.35}
      />
      <rect
        x={x0 + e}
        y={yTop}
        width={innerW}
        height={bodyH}
        fill={COLORS.casita}
        fillOpacity={0.88}
        stroke={COLORS.stroke}
        strokeWidth={0.3}
      />
      {innerW > 0 && innerH > 0 && (
        <rect
          x={x0 + e}
          y={yTop + e}
          width={innerW}
          height={innerH}
          fill={COLORS.casitaInterior}
          stroke={COLORS.casita}
          strokeWidth={0.25}
          strokeDasharray="1 0.8"
        />
      )}
      <rect
        x={x0}
        y={yTechoTop}
        width={W}
        height={techoH}
        fill={COLORS.casitaTecho}
        stroke={COLORS.stroke}
        strokeWidth={0.35}
      />
      <line
        x1={x0}
        y1={yTop}
        x2={x0 + W}
        y2={yTop}
        stroke={COLORS.stroke}
        strokeWidth={0.25}
        strokeDasharray="0.8 0.6"
      />
      {casita.config.columnaEnTecho && (
        <rect
          x={
            hostOX +
            casita.posicionCm.xCm -
            casita.config.columnaAnchoCm / 2
          }
          y={zToY(casita.zSuperiorCm, alturaTotalCm, sideViewH, bottomPad)}
          width={casita.config.columnaAnchoCm}
          height={casita.config.columnaAltoCm}
          fill={COLORS.columna}
          stroke={COLORS.stroke}
          strokeWidth={0.35}
        />
      )}
    </g>
  );
}

function CasitaPlanView({
  casita,
  hostOX,
  hostOY,
}: {
  casita: CasitaComputada;
  hostOX: number;
  hostOY: number;
}) {
  const e = MADERA_ESPESOR_CM;
  const W = casita.config.anchoCm;
  const L = casita.config.largoCm;
  const x0 = hostOX + casita.posicionCm.xCm - W / 2;
  const y0 = hostOY + casita.posicionCm.yCm - L / 2;
  const innerW = Math.max(0, W - 2 * e);
  const innerL = Math.max(0, L - 2 * e);

  return (
    <g>
      <rect
        x={x0}
        y={y0}
        width={W}
        height={L}
        fill={COLORS.casita}
        fillOpacity={0.35}
        stroke={COLORS.casitaTecho}
        strokeWidth={0.6}
        rx={0.5}
      />
      <rect
        x={x0}
        y={y0}
        width={e}
        height={L}
        fill={COLORS.casita}
        fillOpacity={0.75}
        stroke={COLORS.stroke}
        strokeWidth={0.3}
      />
      <rect
        x={x0 + W - e}
        y={y0}
        width={e}
        height={L}
        fill={COLORS.casita}
        fillOpacity={0.75}
        stroke={COLORS.stroke}
        strokeWidth={0.3}
      />
      <rect
        x={x0 + e}
        y={y0}
        width={innerW}
        height={e}
        fill={COLORS.casita}
        fillOpacity={0.75}
        stroke={COLORS.stroke}
        strokeWidth={0.3}
      />
      <rect
        x={x0 + e}
        y={y0 + L - e}
        width={innerW}
        height={e}
        fill={COLORS.casita}
        fillOpacity={0.75}
        stroke={COLORS.stroke}
        strokeWidth={0.3}
      />
      {innerW > 0 && innerL > 0 && (
        <rect
          x={x0 + e}
          y={y0 + e}
          width={innerW}
          height={innerL}
          fill={COLORS.casitaInterior}
          stroke={COLORS.casita}
          strokeWidth={0.25}
          strokeDasharray="1 0.8"
        />
      )}
    </g>
  );
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
  const isEmpty = niveles.length === 0;

  if (isEmpty) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Agregá la base y los pisos para ver la vista previa del apilado.
      </p>
    );
  }

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
              const ySlabTop = zToY(
                nivel.zInferiorCm + MADERA_ESPESOR_CM,
                alturaTotalCm,
                sideViewH,
                bottomPad,
              );
              const h = Math.max(slabPx, MADERA_ESPESOR_CM);
              const tramo = nivel.tramo;
              const casita = nivel.casita;
              const colOffsetX = tramo
                ? sidePad + (maxAncho - tramo.pisoAnchoCm) / 2
                : 0;
              const yColBottom = tramo
                ? zToY(tramo.zInferiorCm, alturaTotalCm, sideViewH, bottomPad)
                : 0;
              const tramoH = tramo ? tramo.zSuperiorCm - tramo.zInferiorCm : 0;
              const casitaCol =
                tramo?.soporte.casitaActiva
                  ? tramo.soporte.casitaColumnaIndice - 1
                  : -1;
              const hostOX = sidePad + (maxAncho - nivel.piso.anchoCm) / 2;

              return (
                <g key={nivel.piso.id}>
                  <rect
                    x={offsetX}
                    y={ySlabTop}
                    width={nivel.piso.anchoCm}
                    height={h}
                    fill={pisoColor(nivel.indice)}
                    stroke={COLORS.stroke}
                    strokeWidth={0.5}
                    rx={1}
                  />
                  <text
                    x={offsetX + nivel.piso.anchoCm / 2}
                    y={ySlabTop + h / 2 + 1.5}
                    textAnchor="middle"
                    className="fill-white text-[4.5px] font-medium"
                  >
                    {nivel.piso.etiqueta}
                  </text>
                  {tramo?.columnaPosiciones.map((pos, index) => {
                    const isCasitaCol = index === casitaCol;
                    const w = isCasitaCol && tramo.soporte.casitaActiva
                      ? tramo.soporte.casitaAnchoCm
                      : tramo.soporte.columnaAnchoCm;
                    const x = colOffsetX + pos.xCm - w / 2;

                    if (isCasitaCol && tramo.soporte.casitaActiva) {
                      const baseH =
                        (tramo.columnaBaseAltoCm / tramo.soporte.columnaAltoCm) *
                        tramoH;
                      const houseH = tramoH - baseH;
                      const houseW = tramo.soporte.casitaAnchoCm;
                      const houseX = colOffsetX + pos.xCm - houseW / 2;
                      const colW = tramo.soporte.columnaAnchoCm;
                      const colX = colOffsetX + pos.xCm - colW / 2;
                      const yBaseTop = yColBottom - baseH;

                      return (
                        <g key={`col-${nivel.piso.id}-${index}`}>
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
                        key={`col-${nivel.piso.id}-${index}`}
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
                  {casita && (
                    <CasitaSideView
                      key={`casita-${nivel.piso.id}`}
                      casita={casita}
                      hostOX={hostOX}
                      alturaTotalCm={alturaTotalCm}
                      sideViewH={sideViewH}
                      bottomPad={bottomPad}
                    />
                  )}
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
              const host = nivel.piso;
              const { ox: hostOX, oy: hostOY } = hostOrigin(
                maxAncho,
                maxLargo,
                planPad,
                host.anchoCm,
                host.largoCm,
              );
              const tramo = nivel.tramo;
              const casita = nivel.casita;
              const casitaCol =
                tramo?.soporte.casitaActiva
                  ? tramo.soporte.casitaColumnaIndice - 1
                  : -1;

              return (
                <g key={`plan-${nivel.piso.id}`}>
                  <rect
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
                  {tramo?.columnaPosiciones.map((pos, index) => {
                    const isCasitaCol = index === casitaCol;
                    const w =
                      isCasitaCol && tramo.soporte.casitaActiva
                        ? tramo.soporte.casitaAnchoCm
                        : tramo.soporte.columnaAnchoCm;
                    const d =
                      isCasitaCol && tramo.soporte.casitaActiva
                        ? tramo.soporte.casitaProfundoCm
                        : tramo.soporte.columnaProfundoCm;
                    const x = hostOX + pos.xCm - w / 2;
                    const y = hostOY + pos.yCm - d / 2;

                    return (
                      <rect
                        key={`plan-col-${nivel.piso.id}-${index}`}
                        x={x}
                        y={y}
                        width={w}
                        height={d}
                        fill={
                          isCasitaCol && tramo.soporte.casitaActiva
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
                  {casita && (
                    <CasitaPlanView
                      key={`plan-casita-${nivel.piso.id}`}
                      casita={casita}
                      hostOX={hostOX}
                      hostOY={hostOY}
                    />
                  )}
                  {tramo?.pisoArribaEtiqueta && (
                    <text
                      x={hostOX + host.anchoCm / 2}
                      y={hostOY - 3}
                      textAnchor="middle"
                      className="fill-zinc-600 text-[4px] dark:fill-zinc-400"
                    >
                      ↑ {tramo.pisoArribaEtiqueta} (columnas sobre {host.etiqueta})
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Cada rectángulo es un piso; los cuadrados grises son columnas. La casita
          violeta muestra paredes de {MADERA_ESPESOR_MM} mm y el interior claro.
        </p>
      </div>
    </div>
  );
}
