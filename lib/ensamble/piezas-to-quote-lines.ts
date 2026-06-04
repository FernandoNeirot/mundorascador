import type { CotizacionMaterial } from "@/lib/cotizador/types";
import { suggestedFabricCutForWood } from "@/lib/materials/wood-fabric-quote";
import type { CommittedQuoteLine } from "@/lib/materials/quote-line";
import {
  computeRascadorEnsamble,
  countColumnasInConfig,
  type RascadorEnsambleConfig,
  type RascadorPieza,
} from "./cat-scratcher";
import type { EnsambleCotizacionPrefs } from "./types";

export const PIEZA_QUOTE_LINE_PREFIX = "from-pieza-";

const MADERA_ROLES = new Set<RascadorPieza["rol"]>([
  "piso",
  "columna",
  "columna-base",
  "casita",
  "casita-frente",
  "casita-fondo",
  "casita-lateral",
  "casita-techo",
  "casita-columna-techo",
]);

function createLineId(suffix: string): string {
  return `${PIEZA_QUOTE_LINE_PREFIX}${suffix}-${crypto.randomUUID()}`;
}

/** Dos caras mayores de la pieza para corte de madera. */
function woodCutFromPieza(pieza: RascadorPieza): {
  anchoCm: number;
  largoCm: number;
} {
  const dims = [pieza.anchoCm, pieza.largoCm, pieza.altoCm].sort(
    (a, b) => b - a,
  );
  return { anchoCm: dims[0], largoCm: dims[1] };
}

function woodLinesFromPieza(
  pieza: RascadorPieza,
  prefs: EnsambleCotizacionPrefs,
): CommittedQuoteLine[] {
  if (!prefs.maderaProductKey.trim()) return [];

  const { anchoCm, largoCm } = woodCutFromPieza(pieza);
  const pairId = crypto.randomUUID();
  const woodLine: CommittedQuoteLine = {
    id: createLineId(`${pieza.id}-madera`),
    productKey: prefs.maderaProductKey,
    cutAnchoCm: String(Math.round(anchoCm * 10) / 10),
    cutLargoCm: String(Math.round(largoCm * 10) / 10),
    pieceCount: String(Math.max(1, pieza.cantidad)),
    quantityUsed: "0",
    pairId,
    pairRole: "madera",
  };

  if (
    !prefs.aplicarTelaEnMaderas ||
    !prefs.telaProductKey.trim()
  ) {
    return [woodLine];
  }

  const fabric = suggestedFabricCutForWood(anchoCm, largoCm);
  const telaLine: CommittedQuoteLine = {
    id: createLineId(`${pieza.id}-tela`),
    productKey: prefs.telaProductKey,
    cutAnchoCm: String(Math.round(fabric.anchoCm * 10) / 10),
    cutLargoCm: String(Math.round(fabric.largoCm * 10) / 10),
    pieceCount: String(Math.max(1, pieza.cantidad)),
    quantityUsed: "0",
    pairId,
    pairRole: "tela",
  };

  return [woodLine, telaLine];
}

function columnExtraLines(
  config: RascadorEnsambleConfig,
  prefs: EnsambleCotizacionPrefs,
): CommittedQuoteLine[] {
  if (!prefs.aplicarExtrasColumnas) return [];

  const total = countColumnasInConfig(config);
  if (total <= 0) return [];

  const hiloMetros = Math.max(
    0,
    Number(prefs.hiloMetrosPorColumna) || 0,
  );
  const tornillos = Math.max(0, Number(prefs.tornillosPorColumna) || 0);
  const lines: CommittedQuoteLine[] = [];

  if (prefs.columnaTelaProductKey.trim()) {
    let colIndex = 0;
    for (const piso of config.pisos) {
      if (piso.soporte) {
        const count = Math.max(1, Math.floor(piso.soporte.columnaCantidad));
        const { columnaAltoCm: alto, columnaDiametroCm: diam } = piso.soporte;
        for (let i = 0; i < count; i += 1) {
          const fabric = suggestedFabricCutForWood(diam, alto);
          lines.push({
            id: createLineId(`col-tela-${colIndex}`),
            productKey: prefs.columnaTelaProductKey,
            cutAnchoCm: String(Math.round(fabric.anchoCm * 10) / 10),
            cutLargoCm: String(Math.round(fabric.largoCm * 10) / 10),
            pieceCount: "1",
            quantityUsed: "0",
          });
          colIndex += 1;
        }
      }
      if (piso.casita?.columnaEnTecho) {
        const { columnaAltoCm: alto, columnaDiametroCm: diam } = piso.casita;
        const fabric = suggestedFabricCutForWood(diam, alto);
        lines.push({
          id: createLineId(`col-tela-${colIndex}`),
          productKey: prefs.columnaTelaProductKey,
          cutAnchoCm: String(Math.round(fabric.anchoCm * 10) / 10),
          cutLargoCm: String(Math.round(fabric.largoCm * 10) / 10),
          pieceCount: "1",
          quantityUsed: "0",
        });
        colIndex += 1;
      }
    }
  }

  if (prefs.columnaHiloProductKey.trim() && hiloMetros > 0) {
    lines.push({
      id: createLineId("col-hilo"),
      productKey: prefs.columnaHiloProductKey,
      cutAnchoCm: "0",
      cutLargoCm: "0",
      pieceCount: "1",
      quantityUsed: String(Math.round(hiloMetros * total * 100) / 100),
    });
  }

  if (prefs.columnaTornillosProductKey.trim() && tornillos > 0) {
    lines.push({
      id: createLineId("col-tornillos"),
      productKey: prefs.columnaTornillosProductKey,
      cutAnchoCm: "0",
      cutLargoCm: "0",
      pieceCount: "1",
      quantityUsed: String(Math.round(tornillos * total)),
    });
  }

  return lines;
}

export function piezasToQuoteLines(
  config: RascadorEnsambleConfig,
  prefs: EnsambleCotizacionPrefs,
): CommittedQuoteLine[] {
  const { piezas } = computeRascadorEnsamble(config);
  const lines: CommittedQuoteLine[] = [];

  for (const pieza of piezas) {
    if (!MADERA_ROLES.has(pieza.rol)) continue;
    lines.push(...woodLinesFromPieza(pieza, prefs));
  }

  lines.push(...columnExtraLines(config, prefs));
  return lines;
}

export function mergePiezasQuoteLines(
  existing: CotizacionMaterial[],
  generated: CommittedQuoteLine[],
): CotizacionMaterial[] {
  const manual = existing.filter(
    (line) => !line.id.startsWith(PIEZA_QUOTE_LINE_PREFIX),
  );
  return [...manual, ...generated];
}

export function isPiezaGeneratedLine(line: CotizacionMaterial): boolean {
  return line.id.startsWith(PIEZA_QUOTE_LINE_PREFIX);
}
