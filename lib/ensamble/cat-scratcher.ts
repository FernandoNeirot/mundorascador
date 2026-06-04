/** Casita ocupa el 80 % del alto del tramo de columna; el 20 % restante sigue siendo poste. */
export const CASITA_HEIGHT_RATIO = 0.8;

/** Espesor fijo de todas las piezas de madera del rascador. */
export const MADERA_ESPESOR_MM = 15;
export const MADERA_ESPESOR_CM = MADERA_ESPESOR_MM / 10;

const MADERA_NOTA = `Madera ${MADERA_ESPESOR_MM} mm`;

const COLUMNA_REDONDA_NOTA = "Columna redonda";

export function columnaDiametroNota(diametroCm: number): string {
  return `${MADERA_NOTA} · ${COLUMNA_REDONDA_NOTA} Ø ${diametroCm} cm`;
}

type LegacyColumnaDiametroSource = {
  columnaDiametroCm?: number;
  columnaAnchoCm?: number;
  columnaProfundoCm?: number;
};

/** Acepta `columnaDiametroCm` o medidas viejas (ancho/profundo). */
export function readColumnaDiametroCm(
  source: LegacyColumnaDiametroSource,
  fallback = 8,
): number {
  const d = source.columnaDiametroCm;
  if (d != null && Number.isFinite(d) && d > 0) return d;
  const ancho = source.columnaAnchoCm;
  if (ancho != null && Number.isFinite(ancho) && ancho > 0) return ancho;
  return fallback;
}

/** Centro de columna en el piso inferior (cm desde borde izquierdo y frontal). */
export type ColumnaPosicionConfig = {
  xCm: number;
  yCm: number;
};

/** Centro del piso elevado sobre el piso inferior (misma referencia que columnas). */
export type PisoPosicionConfig = {
  xCm: number;
  yCm: number;
};

/** Columnas verticales sobre la tabla del piso (no requiere piso superior). */
export type SoporteTramoConfig = {
  columnaCantidad: number;
  columnaAltoCm: number;
  columnaDiametroCm: number;
  columnaPosiciones: ColumnaPosicionConfig[];
  /** Legacy: casita embebida en columna; usar `casita` en el piso. */
  casitaActiva: boolean;
  casitaColumnaIndice: number;
  casitaAnchoCm: number;
  casitaProfundoCm: number;
};

/** Casita apoyada en la tabla del piso (techo, laterales, frente, fondo). */
export type CasitaEnPisoConfig = {
  posicionCm: ColumnaPosicionConfig;
  anchoCm: number;
  largoCm: number;
  altoCm: number;
  columnaEnTecho: boolean;
  columnaAltoCm: number;
  columnaDiametroCm: number;
};

export type PisoNivelConfig = {
  id: string;
  etiqueta: string;
  anchoCm: number;
  largoCm: number;
  /** Centro sobre el piso inferior (pisos elevados). */
  posicionCm?: PisoPosicionConfig;
  /** Columnas sobre esta tabla. */
  soporte?: SoporteTramoConfig;
  /** Casita sobre esta tabla (independiente de columnas). */
  casita?: CasitaEnPisoConfig;
};

export type RascadorEnsambleConfig = {
  nombre: string;
  pisos: PisoNivelConfig[];
};

export type RascadorPieza = {
  id: string;
  rol:
    | "piso"
    | "columna"
    | "columna-base"
    | "casita"
    | "casita-frente"
    | "casita-fondo"
    | "casita-lateral"
    | "casita-techo"
    | "casita-columna-techo";
  etiqueta: string;
  anchoCm: number;
  largoCm: number;
  altoCm: number;
  cantidad: number;
  notas?: string;
};

export type TramoComputado = {
  casitaAltoCm: number;
  columnaBaseAltoCm: number;
  casitaColumnaIndice: number;
  soporte: SoporteTramoConfig;
  /** Piso donde apoyan las columnas (este nivel). */
  pisoAnchoCm: number;
  pisoLargoCm: number;
  columnaPosiciones: ColumnaPosicionConfig[];
  zInferiorCm: number;
  zSuperiorCm: number;
  pisoArribaEtiqueta?: string;
};

export type CasitaComputada = {
  config: CasitaEnPisoConfig;
  posicionCm: ColumnaPosicionConfig;
  zInferiorCm: number;
  zCuerpoSuperiorCm: number;
  zTechoSuperiorCm: number;
  zSuperiorCm: number;
};

export type NivelComputado = {
  /** Índice en config.pisos (0 = arriba, último = base). */
  indice: number;
  piso: PisoNivelConfig;
  esBase: boolean;
  zInferiorCm: number;
  zSuperiorCm: number;
  tramo?: TramoComputado;
  casita?: CasitaComputada;
  posicionCm: PisoPosicionConfig;
  pisoInferior?: Pick<PisoNivelConfig, "id" | "etiqueta" | "anchoCm" | "largoCm">;
};

export type RascadorEnsambleComputed = {
  config: RascadorEnsambleConfig;
  niveles: NivelComputado[];
  alturaTotalCm: number;
  piezas: RascadorPieza[];
};

export function withDefaultPositions(
  tramo: Omit<SoporteTramoConfig, "columnaPosiciones"> & {
    columnaPosiciones?: ColumnaPosicionConfig[];
  },
  pisoAnchoCm: number,
  pisoLargoCm: number,
): SoporteTramoConfig {
  const base = {
    columnaCantidad: tramo.columnaCantidad,
    columnaAltoCm: tramo.columnaAltoCm,
    columnaDiametroCm: readColumnaDiametroCm(tramo),
    casitaActiva: tramo.casitaActiva,
    casitaColumnaIndice: tramo.casitaColumnaIndice,
    casitaAnchoCm: tramo.casitaAnchoCm,
    casitaProfundoCm: tramo.casitaProfundoCm,
    columnaPosiciones: tramo.columnaPosiciones ?? [],
  };
  return normalizeSoporteTramo(base, pisoAnchoCm, pisoLargoCm);
}

export const DEFAULT_SOPORTE_TRAMO: SoporteTramoConfig = withDefaultPositions(
  {
    columnaCantidad: 3,
    columnaAltoCm: 30,
    columnaDiametroCm: 8,
    casitaActiva: false,
    casitaColumnaIndice: 2,
    casitaAnchoCm: 28,
    casitaProfundoCm: 28,
  },
  60,
  40,
);

export function createPisoId(): string {
  return crypto.randomUUID();
}

export function createPisoNivel(
  etiqueta: string,
  anchoCm: number,
  largoCm: number,
  soporte?: SoporteTramoConfig,
): PisoNivelConfig {
  return {
    id: createPisoId(),
    etiqueta,
    anchoCm,
    largoCm,
    soporte,
  };
}

export const EMPTY_RASCADOR_CONFIG: RascadorEnsambleConfig = {
  nombre: "",
  pisos: [],
};

/** Formato guardado: primer piso = arriba, último = base en el suelo. */
export const DEFAULT_RASCADOR_CONFIG: RascadorEnsambleConfig = {
  nombre: "Rascador gatos",
  pisos: [
    createPisoNivel("Cima", 35, 35),
    createPisoNivel(
      "Nivel 2",
      45,
      32,
      withDefaultPositions(
        {
          columnaCantidad: 2,
          columnaAltoCm: 38,
          columnaDiametroCm: 8,
          casitaActiva: true,
          casitaColumnaIndice: 2,
          casitaAnchoCm: 28,
          casitaProfundoCm: 28,
          columnaPosiciones: [
            { xCm: 14, yCm: 20 },
            { xCm: 46, yCm: 20 },
          ],
        },
        45,
        32,
      ),
    ),
    createPisoNivel(
      "Nivel 1",
      55,
      40,
      withDefaultPositions(
        {
          columnaCantidad: 3,
          columnaAltoCm: 28,
          columnaDiametroCm: 8,
          casitaActiva: false,
          casitaColumnaIndice: 2,
          casitaAnchoCm: 28,
          casitaProfundoCm: 28,
        },
        55,
        40,
      ),
    ),
    createPisoNivel(
      "Base",
      60,
      40,
      withDefaultPositions(
        {
          columnaCantidad: 3,
          columnaAltoCm: 28,
          columnaDiametroCm: 8,
          casitaActiva: false,
          casitaColumnaIndice: 2,
          casitaAnchoCm: 28,
          casitaProfundoCm: 28,
        },
        60,
        40,
      ),
    ),
  ],
};

/** Documentos viejos tenían la base en el índice 0 del array. */
export function isLegacyBaseFirstOrder(pisos: PisoNivelConfig[]): boolean {
  if (pisos.length === 0) return false;
  return pisos[0].etiqueta.toLowerCase().includes("base");
}

/** Antes las columnas vivían en el piso superior (índice 0), no en el portador. */
export function needsSoportePortadorMigration(
  pisos: PisoNivelConfig[],
): boolean {
  return pisos.length > 1 && !!pisos[0]?.soporte;
}

export function migrateSoporteOntoPisoPortador(
  pisos: PisoNivelConfig[],
): PisoNivelConfig[] {
  if (!needsSoportePortadorMigration(pisos)) {
    return pisos;
  }
  const next = pisos.map((p) => ({ ...p }));
  for (let i = 0; i < next.length - 1; i += 1) {
    if (!next[i].soporte) continue;
    if (!next[i + 1].soporte) {
      next[i + 1] = { ...next[i + 1], soporte: next[i].soporte };
    }
    next[i] = { ...next[i], soporte: undefined };
  }
  return next;
}

export function normalizeConfigPisosOrder(
  config: RascadorEnsambleConfig,
): RascadorEnsambleConfig {
  let pisos = config.pisos;
  if (isLegacyBaseFirstOrder(pisos)) {
    pisos = [...pisos].reverse();
  }
  pisos = migrateSoporteOntoPisoPortador(pisos);
  return { ...config, pisos };
}

export function isPisoBaseIndex(index: number, total: number): boolean {
  return total > 0 && index === total - 1;
}

export function buildDefaultPisoPosicion(
  pisoAnchoCm: number,
  pisoLargoCm: number,
): PisoPosicionConfig {
  return { xCm: pisoAnchoCm / 2, yCm: pisoLargoCm / 2 };
}

export function clampPisoPosicion(
  pos: PisoPosicionConfig,
  pisoAnchoCm: number,
  pisoLargoCm: number,
  footprintAnchoCm: number,
  footprintProfundoCm: number,
): PisoPosicionConfig {
  const minX = footprintAnchoCm / 2;
  const maxX = Math.max(minX, pisoAnchoCm - footprintAnchoCm / 2);
  const minY = footprintProfundoCm / 2;
  const maxY = Math.max(minY, pisoLargoCm - footprintProfundoCm / 2);
  return {
    xCm: Math.min(maxX, Math.max(minX, pos.xCm)),
    yCm: Math.min(maxY, Math.max(minY, pos.yCm)),
  };
}

export function resolvePisoPosicion(
  piso: PisoNivelConfig,
  pisoInferior: Pick<PisoNivelConfig, "anchoCm" | "largoCm">,
): PisoPosicionConfig {
  const fallback = buildDefaultPisoPosicion(
    pisoInferior.anchoCm,
    pisoInferior.largoCm,
  );
  const raw = piso.posicionCm ?? fallback;
  return clampPisoPosicion(
    raw,
    pisoInferior.anchoCm,
    pisoInferior.largoCm,
    piso.anchoCm,
    piso.largoCm,
  );
}

/** Posiciones X (cm) del centro de cada columna repartidas en el ancho. */
export function getColumnCenters(pisoAnchoCm: number, count: number): number[] {
  if (count <= 1) return [pisoAnchoCm / 2];
  const margin = Math.min(pisoAnchoCm * 0.15, 8);
  const span = pisoAnchoCm - margin * 2;
  return Array.from({ length: count }, (_, i) =>
    margin + (span * i) / (count - 1),
  );
}

export function buildDefaultColumnPositions(
  pisoAnchoCm: number,
  pisoLargoCm: number,
  count: number,
): ColumnaPosicionConfig[] {
  const xs = getColumnCenters(pisoAnchoCm, count);
  const yCm = pisoLargoCm / 2;
  return xs.map((xCm) => ({ xCm, yCm }));
}

function footprintCm(
  tramo: SoporteTramoConfig,
  index: number,
): { anchoCm: number; profundoCm: number } {
  const columnaIndex = index + 1;
  const esCasita =
    tramo.casitaActiva && columnaIndex === tramo.casitaColumnaIndice;
  return esCasita
    ? { anchoCm: tramo.casitaAnchoCm, profundoCm: tramo.casitaProfundoCm }
    : {
        anchoCm: tramo.columnaDiametroCm,
        profundoCm: tramo.columnaDiametroCm,
      };
}

export function clampColumnaPosicion(
  pos: ColumnaPosicionConfig,
  pisoAnchoCm: number,
  pisoLargoCm: number,
  footprintAnchoCm: number,
  footprintProfundoCm: number,
): ColumnaPosicionConfig {
  const minX = footprintAnchoCm / 2;
  const maxX = Math.max(minX, pisoAnchoCm - footprintAnchoCm / 2);
  const minY = footprintProfundoCm / 2;
  const maxY = Math.max(minY, pisoLargoCm - footprintProfundoCm / 2);
  return {
    xCm: Math.min(maxX, Math.max(minX, pos.xCm)),
    yCm: Math.min(maxY, Math.max(minY, pos.yCm)),
  };
}

/** Ajusta cantidad de columnas y posiciones al piso inferior. */
export function normalizeSoporteTramo(
  tramo: SoporteTramoConfig,
  pisoAnchoCm: number,
  pisoLargoCm: number,
): SoporteTramoConfig {
  const columnaCantidad = Math.max(1, Math.floor(tramo.columnaCantidad));
  const defaults = buildDefaultColumnPositions(
    pisoAnchoCm,
    pisoLargoCm,
    columnaCantidad,
  );
  const columnaPosiciones = defaults.map((fallback, index) => {
    const raw = tramo.columnaPosiciones[index];
    const pos = {
      xCm: raw?.xCm ?? fallback.xCm,
      yCm: raw?.yCm ?? fallback.yCm,
    };
    const foot = footprintCm(tramo, index);
    return clampColumnaPosicion(
      pos,
      pisoAnchoCm,
      pisoLargoCm,
      foot.anchoCm,
      foot.profundoCm,
    );
  });

  return {
    columnaCantidad,
    columnaAltoCm: tramo.columnaAltoCm,
    columnaDiametroCm: Math.max(
      MADERA_ESPESOR_CM,
      readColumnaDiametroCm(tramo),
    ),
    columnaPosiciones,
    casitaActiva: tramo.casitaActiva,
    casitaColumnaIndice: clampColumnIndex({
      ...tramo,
      columnaCantidad,
    }),
    casitaAnchoCm: tramo.casitaAnchoCm,
    casitaProfundoCm: tramo.casitaProfundoCm,
  };
}

function clampColumnIndex(tramo: SoporteTramoConfig): number {
  const max = Math.max(1, Math.floor(tramo.columnaCantidad));
  const idx = Math.floor(tramo.casitaColumnaIndice);
  return Math.min(max, Math.max(1, idx));
}

export function normalizeCasitaEnPiso(
  casita: CasitaEnPisoConfig,
  pisoAnchoCm: number,
  pisoLargoCm: number,
): CasitaEnPisoConfig {
  const anchoCm = Math.max(MADERA_ESPESOR_CM, casita.anchoCm);
  const largoCm = Math.max(MADERA_ESPESOR_CM, casita.largoCm);
  const altoCm = Math.max(MADERA_ESPESOR_CM, casita.altoCm);
  const fallback = buildDefaultPisoPosicion(pisoAnchoCm, pisoLargoCm);
  const posicionCm = clampColumnaPosicion(
    casita.posicionCm ?? fallback,
    pisoAnchoCm,
    pisoLargoCm,
    anchoCm,
    largoCm,
  );
  return {
    ...casita,
    anchoCm,
    largoCm,
    altoCm,
    posicionCm,
    columnaAltoCm: Math.max(MADERA_ESPESOR_CM, casita.columnaAltoCm),
    columnaDiametroCm: Math.max(
      MADERA_ESPESOR_CM,
      readColumnaDiametroCm(casita),
    ),
  };
}

function computeCasitaComputada(
  casita: CasitaEnPisoConfig,
  zTablaSuperiorCm: number,
  pisoAnchoCm: number,
  pisoLargoCm: number,
): CasitaComputada {
  const config = normalizeCasitaEnPiso(casita, pisoAnchoCm, pisoLargoCm);
  const zInferiorCm = zTablaSuperiorCm;
  const zCuerpoSuperiorCm = zInferiorCm + config.altoCm;
  const zTechoSuperiorCm = zCuerpoSuperiorCm + MADERA_ESPESOR_CM;
  const zSuperiorCm =
    zTechoSuperiorCm +
    (config.columnaEnTecho ? config.columnaAltoCm : 0);
  return {
    config,
    posicionCm: config.posicionCm,
    zInferiorCm,
    zCuerpoSuperiorCm,
    zTechoSuperiorCm,
    zSuperiorCm,
  };
}

function appendCasitaEnPisoPiezas(
  piezas: RascadorPieza[],
  casita: CasitaEnPisoConfig,
  nivelEtiqueta: string,
  pisoIndex: number,
): void {
  const prefix = `casita-piso-${pisoIndex}`;
  const e = MADERA_ESPESOR_CM;
  piezas.push(
    {
      id: `${prefix}-frente`,
      rol: "casita-frente",
      etiqueta: `${nivelEtiqueta} · casita frente`,
      anchoCm: casita.anchoCm,
      largoCm: e,
      altoCm: casita.altoCm,
      cantidad: 1,
      notas: MADERA_NOTA,
    },
    {
      id: `${prefix}-fondo`,
      rol: "casita-fondo",
      etiqueta: `${nivelEtiqueta} · casita fondo`,
      anchoCm: casita.anchoCm,
      largoCm: e,
      altoCm: casita.altoCm,
      cantidad: 1,
      notas: MADERA_NOTA,
    },
    {
      id: `${prefix}-lateral`,
      rol: "casita-lateral",
      etiqueta: `${nivelEtiqueta} · casita lateral`,
      anchoCm: e,
      largoCm: casita.largoCm,
      altoCm: casita.altoCm,
      cantidad: 2,
      notas: MADERA_NOTA,
    },
    {
      id: `${prefix}-techo`,
      rol: "casita-techo",
      etiqueta: `${nivelEtiqueta} · casita techo`,
      anchoCm: casita.anchoCm,
      largoCm: casita.largoCm,
      altoCm: e,
      cantidad: 1,
      notas: MADERA_NOTA,
    },
  );
  if (casita.columnaEnTecho) {
    piezas.push({
      id: `${prefix}-columna-techo`,
      rol: "casita-columna-techo",
      etiqueta: `${nivelEtiqueta} · columna techo casita`,
      anchoCm: casita.columnaDiametroCm,
      largoCm: casita.columnaDiametroCm,
      altoCm: casita.columnaAltoCm,
      cantidad: 1,
      notas: columnaDiametroNota(casita.columnaDiametroCm),
    });
  }
}

function appendTramoPiezas(
  piezas: RascadorPieza[],
  tramo: SoporteTramoConfig,
  nivelEtiqueta: string,
  pisoIndex: number,
): void {
  const columnaCantidad = Math.max(1, Math.floor(tramo.columnaCantidad));
  const casitaColumna = clampColumnIndex({
    ...tramo,
    columnaCantidad,
  });
  const casitaAltoCm = tramo.columnaAltoCm * CASITA_HEIGHT_RATIO;
  const columnaBaseAltoCm = tramo.columnaAltoCm - casitaAltoCm;
  const d = tramo.columnaDiametroCm;

  for (let i = 1; i <= columnaCantidad; i += 1) {
    const conCasita = tramo.casitaActiva && i === casitaColumna;
    const prefix = `${pisoIndex}-${i}`;

    if (conCasita) {
      piezas.push({
        id: `columna-base-${prefix}`,
        rol: "columna-base",
        etiqueta: `${nivelEtiqueta} · columna ${i} (base)`,
        anchoCm: d,
        largoCm: d,
        altoCm: columnaBaseAltoCm,
        cantidad: 1,
        notas: `${(1 - CASITA_HEIGHT_RATIO) * 100}% del tramo · ${columnaDiametroNota(d)}`,
      });
      piezas.push({
        id: `casita-${prefix}`,
        rol: "casita",
        etiqueta: `${nivelEtiqueta} · casita (col. ${i})`,
        anchoCm: tramo.casitaAnchoCm,
        largoCm: tramo.casitaProfundoCm,
        altoCm: casitaAltoCm,
        cantidad: 1,
        notas: `${CASITA_HEIGHT_RATIO * 100}% del tramo · ${MADERA_NOTA}`,
      });
    } else {
      piezas.push({
        id: `columna-${prefix}`,
        rol: "columna",
        etiqueta: `${nivelEtiqueta} · columna ${i}`,
        anchoCm: d,
        largoCm: d,
        altoCm: tramo.columnaAltoCm,
        cantidad: 1,
        notas: columnaDiametroNota(d),
      });
    }
  }
}

export function computeRascadorEnsamble(
  config: RascadorEnsambleConfig,
): RascadorEnsambleComputed {
  const normalized = normalizeConfigPisosOrder(config);
  const pisos = normalized.pisos;

  if (pisos.length === 0) {
    return {
      config: normalized,
      niveles: [],
      alturaTotalCm: 0,
      piezas: [],
    };
  }

  const piezas: RascadorPieza[] = [];
  const niveles: NivelComputado[] = [];
  let z = 0;
  const stackOrder = [...pisos].reverse();

  for (let stackIndex = 0; stackIndex < stackOrder.length; stackIndex += 1) {
    const piso = stackOrder[stackIndex];
    const indice = pisos.length - 1 - stackIndex;
    const esBase = isPisoBaseIndex(indice, pisos.length);
    const pisoInferior =
      stackIndex > 0 ? stackOrder[stackIndex - 1] : undefined;
    const pisoArriba =
      stackIndex < stackOrder.length - 1
        ? stackOrder[stackIndex + 1]
        : undefined;

    const zInferiorCm = z;
    z += MADERA_ESPESOR_CM;
    const zTablaSuperiorCm = z;
    let zNivelSuperiorCm = zTablaSuperiorCm;

    piezas.push({
      id: `piso-${piso.id}`,
      rol: "piso",
      etiqueta: `Piso · ${piso.etiqueta}`,
      anchoCm: piso.anchoCm,
      largoCm: piso.largoCm,
      altoCm: MADERA_ESPESOR_CM,
      cantidad: 1,
      notas: MADERA_NOTA,
    });

    let tramo: TramoComputado | undefined;
    let casitaComputada: CasitaComputada | undefined;

    if (piso.soporte) {
      const zTramoInferior = zTablaSuperiorCm;
      const soporte = normalizeSoporteTramo(
        piso.soporte,
        piso.anchoCm,
        piso.largoCm,
      );
      const casitaAltoCm = soporte.columnaAltoCm * CASITA_HEIGHT_RATIO;
      const columnaBaseAltoCm = soporte.columnaAltoCm - casitaAltoCm;
      const zTramoSuperior = zTramoInferior + soporte.columnaAltoCm;

      zNivelSuperiorCm = Math.max(zNivelSuperiorCm, zTramoSuperior);
      tramo = {
        casitaAltoCm,
        columnaBaseAltoCm,
        casitaColumnaIndice: soporte.casitaColumnaIndice,
        soporte,
        pisoAnchoCm: piso.anchoCm,
        pisoLargoCm: piso.largoCm,
        columnaPosiciones: soporte.columnaPosiciones,
        zInferiorCm: zTramoInferior,
        zSuperiorCm: zTramoSuperior,
        pisoArribaEtiqueta: pisoArriba?.etiqueta,
      };

      appendTramoPiezas(piezas, tramo.soporte, piso.etiqueta, indice);
    }

    if (piso.casita) {
      casitaComputada = computeCasitaComputada(
        piso.casita,
        zTablaSuperiorCm,
        piso.anchoCm,
        piso.largoCm,
      );
      zNivelSuperiorCm = Math.max(
        zNivelSuperiorCm,
        casitaComputada.zSuperiorCm,
      );
      appendCasitaEnPisoPiezas(
        piezas,
        casitaComputada.config,
        piso.etiqueta,
        indice,
      );
    }

    z = zNivelSuperiorCm;

    const posicionCm =
      !pisoInferior
        ? buildDefaultPisoPosicion(piso.anchoCm, piso.largoCm)
        : resolvePisoPosicion(piso, pisoInferior);

    niveles.push({
      indice,
      piso,
      esBase,
      zInferiorCm,
      zSuperiorCm: zNivelSuperiorCm,
      tramo,
      casita: casitaComputada,
      posicionCm,
      pisoInferior: pisoInferior
        ? {
            id: pisoInferior.id,
            etiqueta: pisoInferior.etiqueta,
            anchoCm: pisoInferior.anchoCm,
            largoCm: pisoInferior.largoCm,
          }
        : undefined,
    });
  }

  return {
    config: normalized,
    niveles,
    alturaTotalCm: z,
    piezas,
  };
}

export function parsePositiveCm(value: string, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function parsePositiveInt(value: string, fallback: number): number {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function casitaToDraft(casita: CasitaEnPisoConfig): CasitaEnPisoDraft {
  return {
    posicionCm: {
      xCm: String(casita.posicionCm.xCm),
      yCm: String(casita.posicionCm.yCm),
    },
    anchoCm: String(casita.anchoCm),
    largoCm: String(casita.largoCm),
    altoCm: String(casita.altoCm),
    columnaEnTecho: casita.columnaEnTecho,
    columnaAltoCm: String(casita.columnaAltoCm),
    columnaDiametroCm: String(casita.columnaDiametroCm),
  };
}

export function createDefaultCasitaEnPisoDraft(
  pisoAnchoCm: number,
  pisoLargoCm: number,
): CasitaEnPisoDraft {
  const pos = buildDefaultPisoPosicion(pisoAnchoCm, pisoLargoCm);
  return {
    ...DEFAULT_CASITA_DRAFT,
    posicionCm: {
      xCm: String(Math.round(pos.xCm)),
      yCm: String(Math.round(pos.yCm)),
    },
  };
}

export function syncCasitaDraftPosition(
  casita: CasitaEnPisoDraft,
  pisoAnchoCm: number,
  pisoLargoCm: number,
  anchoCm: number,
  largoCm: number,
): CasitaEnPisoDraft {
  const parsed = parseCasitaEnPiso(
    casita,
    pisoAnchoCm,
    pisoLargoCm,
    normalizeCasitaEnPiso(
      {
        posicionCm: buildDefaultPisoPosicion(pisoAnchoCm, pisoLargoCm),
        anchoCm,
        largoCm,
        altoCm: parsePositiveCm(casita.altoCm, 24),
        columnaEnTecho: casita.columnaEnTecho,
        columnaAltoCm: parsePositiveCm(casita.columnaAltoCm, 20),
        columnaDiametroCm: parsePositiveCm(casita.columnaDiametroCm, 8),
      },
      pisoAnchoCm,
      pisoLargoCm,
    ),
  );
  return casitaToDraft(parsed);
}

export function parseCasitaEnPiso(
  draft: CasitaEnPisoDraft,
  pisoAnchoCm: number,
  pisoLargoCm: number,
  fallback?: CasitaEnPisoConfig,
): CasitaEnPisoConfig {
  const def = fallback ?? normalizeCasitaEnPiso(
    {
      posicionCm: buildDefaultPisoPosicion(pisoAnchoCm, pisoLargoCm),
      anchoCm: 28,
      largoCm: 28,
      altoCm: 24,
      columnaEnTecho: false,
      columnaAltoCm: 20,
      columnaDiametroCm: 8,
    },
    pisoAnchoCm,
    pisoLargoCm,
  );
  const posFallback = def.posicionCm;
  return normalizeCasitaEnPiso(
    {
      posicionCm: {
        xCm: parsePositiveCm(draft.posicionCm.xCm, posFallback.xCm),
        yCm: parsePositiveCm(draft.posicionCm.yCm, posFallback.yCm),
      },
      anchoCm: parsePositiveCm(draft.anchoCm, def.anchoCm),
      largoCm: parsePositiveCm(draft.largoCm, def.largoCm),
      altoCm: parsePositiveCm(draft.altoCm, def.altoCm),
      columnaEnTecho: draft.columnaEnTecho,
      columnaAltoCm: parsePositiveCm(draft.columnaAltoCm, def.columnaAltoCm),
      columnaDiametroCm: parseColumnaDiametroFromDraft(
        draft,
        def.columnaDiametroCm,
      ),
    },
    pisoAnchoCm,
    pisoLargoCm,
  );
}

function parseColumnaDiametroFromDraft(
  draft: { columnaDiametroCm?: string; columnaAnchoCm?: string },
  fallback: number,
): number {
  const raw =
    draft.columnaDiametroCm?.trim() || draft.columnaAnchoCm?.trim() || "";
  return parsePositiveCm(raw, fallback);
}

export function parseSoporteTramo(
  draft: SoporteTramoDraft,
  pisoAnchoCm: number,
  pisoLargoCm: number,
  fallback: SoporteTramoConfig = DEFAULT_SOPORTE_TRAMO,
): SoporteTramoConfig {
  const columnaCantidad = parsePositiveInt(
    draft.columnaCantidad,
    fallback.columnaCantidad,
  );
  const defaults = buildDefaultColumnPositions(
    pisoAnchoCm,
    pisoLargoCm,
    columnaCantidad,
  );
  const columnaPosiciones = defaults.map((def, index) => {
    const raw = draft.columnaPosiciones[index];
    return {
      xCm: parsePositiveCm(raw?.xCm ?? "", def.xCm),
      yCm: parsePositiveCm(raw?.yCm ?? "", def.yCm),
    };
  });

  return normalizeSoporteTramo(
    {
      columnaCantidad,
      columnaAltoCm: parsePositiveCm(draft.columnaAltoCm, fallback.columnaAltoCm),
      columnaDiametroCm: parseColumnaDiametroFromDraft(
        draft,
        fallback.columnaDiametroCm,
      ),
      columnaPosiciones,
      casitaActiva: draft.casitaActiva,
      casitaColumnaIndice: parsePositiveInt(
        draft.casitaColumnaIndice,
        fallback.casitaColumnaIndice,
      ),
      casitaAnchoCm: parsePositiveCm(draft.casitaAnchoCm, fallback.casitaAnchoCm),
      casitaProfundoCm: parsePositiveCm(
        draft.casitaProfundoCm,
        fallback.casitaProfundoCm,
      ),
    },
    pisoAnchoCm,
    pisoLargoCm,
  );
}

export type ColumnaPosicionDraft = {
  xCm: string;
  yCm: string;
};

export type SoporteTramoDraft = {
  columnaCantidad: string;
  columnaAltoCm: string;
  columnaDiametroCm: string;
  columnaPosiciones: ColumnaPosicionDraft[];
  casitaActiva: boolean;
  casitaColumnaIndice: string;
  casitaAnchoCm: string;
  casitaProfundoCm: string;
};

export type PisoPosicionDraft = {
  xCm: string;
  yCm: string;
};

export type CasitaEnPisoDraft = {
  posicionCm: ColumnaPosicionDraft;
  anchoCm: string;
  largoCm: string;
  altoCm: string;
  columnaEnTecho: boolean;
  columnaAltoCm: string;
  columnaDiametroCm: string;
};

export const DEFAULT_CASITA_DRAFT: CasitaEnPisoDraft = {
  posicionCm: { xCm: "30", yCm: "20" },
  anchoCm: "28",
  largoCm: "28",
  altoCm: "24",
  columnaEnTecho: false,
  columnaAltoCm: "20",
  columnaDiametroCm: "8",
};

export type PisoNivelDraft = {
  id: string;
  etiqueta: string;
  anchoCm: string;
  largoCm: string;
  esBase: boolean;
  conColumnas: boolean;
  soporte: SoporteTramoDraft | null;
  conCasita: boolean;
  casita: CasitaEnPisoDraft | null;
  posicionCm: PisoPosicionDraft | null;
};

export function soporteToDraft(soporte: SoporteTramoConfig): SoporteTramoDraft {
  return {
    columnaCantidad: String(soporte.columnaCantidad),
    columnaAltoCm: String(soporte.columnaAltoCm),
    columnaDiametroCm: String(soporte.columnaDiametroCm),
    columnaPosiciones: soporte.columnaPosiciones.map((pos) => ({
      xCm: String(pos.xCm),
      yCm: String(pos.yCm),
    })),
    casitaActiva: soporte.casitaActiva,
    casitaColumnaIndice: String(soporte.casitaColumnaIndice),
    casitaAnchoCm: String(soporte.casitaAnchoCm),
    casitaProfundoCm: String(soporte.casitaProfundoCm),
  };
}

export function syncSoporteDraftPositions(
  soporte: SoporteTramoDraft,
  pisoAnchoCm: number,
  pisoLargoCm: number,
): SoporteTramoDraft {
  const count = Math.max(1, Math.floor(Number(soporte.columnaCantidad) || 1));
  const defaults = buildDefaultColumnPositions(pisoAnchoCm, pisoLargoCm, count);
  const columnaPosiciones = defaults.map((def, index) => {
    const existing = soporte.columnaPosiciones[index];
    return {
      xCm: existing?.xCm?.trim() ? existing.xCm : String(Math.round(def.xCm)),
      yCm: existing?.yCm?.trim() ? existing.yCm : String(Math.round(def.yCm)),
    };
  });
  return { ...soporte, columnaCantidad: String(count), columnaPosiciones };
}

export function redistributeSoporteDraftPositions(
  soporte: SoporteTramoDraft,
  pisoAnchoCm: number,
  pisoLargoCm: number,
): SoporteTramoDraft {
  const count = Math.max(1, Math.floor(Number(soporte.columnaCantidad) || 1));
  const positions = buildDefaultColumnPositions(pisoAnchoCm, pisoLargoCm, count);
  return {
    ...soporte,
    columnaPosiciones: positions.map((pos) => ({
      xCm: String(Math.round(pos.xCm)),
      yCm: String(Math.round(pos.yCm)),
    })),
  };
}

export function createDefaultPisoPosicionDraft(
  pisoAnchoCm: number,
  pisoLargoCm: number,
): PisoPosicionDraft {
  const pos = buildDefaultPisoPosicion(pisoAnchoCm, pisoLargoCm);
  return {
    xCm: String(Math.round(pos.xCm)),
    yCm: String(Math.round(pos.yCm)),
  };
}

export function parsePisoPosicionDraft(
  draft: PisoPosicionDraft | null,
  pisoInferior: Pick<PisoNivelConfig, "anchoCm" | "largoCm">,
  pisoAnchoCm: number,
  pisoLargoCm: number,
): PisoPosicionConfig {
  const fallback = buildDefaultPisoPosicion(
    pisoInferior.anchoCm,
    pisoInferior.largoCm,
  );
  const raw = {
    xCm: parsePositiveCm(draft?.xCm ?? "", fallback.xCm),
    yCm: parsePositiveCm(draft?.yCm ?? "", fallback.yCm),
  };
  return clampPisoPosicion(
    raw,
    pisoInferior.anchoCm,
    pisoInferior.largoCm,
    pisoAnchoCm,
    pisoLargoCm,
  );
}

export function centerPisoPosicionDraft(
  draft: PisoPosicionDraft | null,
  pisoInferiorAnchoCm: number,
  pisoInferiorLargoCm: number,
): PisoPosicionDraft {
  return createDefaultPisoPosicionDraft(pisoInferiorAnchoCm, pisoInferiorLargoCm);
}

export function pisoToDraft(
  piso: PisoNivelConfig,
  index: number,
  total: number,
): PisoNivelDraft {
  const esBase = isPisoBaseIndex(index, total);
  return {
    id: piso.id,
    etiqueta: piso.etiqueta,
    anchoCm: String(piso.anchoCm),
    largoCm: String(piso.largoCm),
    esBase,
    conColumnas: !!piso.soporte,
    soporte: piso.soporte ? soporteToDraft(piso.soporte) : null,
    conCasita: !!piso.casita,
    casita: piso.casita ? casitaToDraft(piso.casita) : null,
    posicionCm: piso.posicionCm
      ? {
          xCm: String(piso.posicionCm.xCm),
          yCm: String(piso.posicionCm.yCm),
        }
      : null,
  };
}

export function draftToPiso(
  draft: PisoNivelDraft,
  pisoInferior?: Pick<PisoNivelConfig, "anchoCm" | "largoCm">,
  _soportaElementosEnTabla = true,
  fallbackSoporte = DEFAULT_SOPORTE_TRAMO,
): PisoNivelConfig {
  const def = DEFAULT_RASCADOR_CONFIG.pisos[0] ?? {
    anchoCm: 50,
    largoCm: 40,
  };
  const anchoCm = parsePositiveCm(draft.anchoCm, def.anchoCm);
  const largoCm = parsePositiveCm(draft.largoCm, def.largoCm);
  const esBase = draft.esBase;

  return {
    id: draft.id,
    etiqueta: draft.etiqueta.trim() || (esBase ? "Base" : "Piso"),
    anchoCm,
    largoCm,
    posicionCm: !pisoInferior
      ? undefined
      : parsePisoPosicionDraft(
          draft.posicionCm,
          pisoInferior,
          anchoCm,
          largoCm,
        ),
    soporte:
      !draft.conColumnas || !draft.soporte
        ? undefined
        : parseSoporteTramo(
            draft.soporte,
            anchoCm,
            largoCm,
            fallbackSoporte,
          ),
    casita:
      !draft.conCasita || !draft.casita
        ? undefined
        : parseCasitaEnPiso(draft.casita, anchoCm, largoCm),
  };
}

export function configToDraftPisos(
  config: RascadorEnsambleConfig,
): PisoNivelDraft[] {
  const normalized = normalizeConfigPisosOrder(config);
  const total = normalized.pisos.length;
  return normalized.pisos.map((piso, i) => pisoToDraft(piso, i, total));
}

export function draftPisosToConfig(
  nombre: string,
  pisosDraft: PisoNivelDraft[],
): RascadorEnsambleConfig {
  const parsed: PisoNivelConfig[] = new Array(pisosDraft.length);
  for (let i = pisosDraft.length - 1; i >= 0; i -= 1) {
    const inferior =
      i < pisosDraft.length - 1 ? parsed[i + 1] : undefined;
    parsed[i] = draftToPiso(
      pisosDraft[i],
      inferior,
      pisoSoportaNivelArriba(i, pisosDraft),
    );
  }
  return {
    nombre: nombre.trim() || "Sin nombre",
    pisos: parsed,
  };
}

export function createEmptyPisoDraft(
  esBase: boolean,
  etiqueta?: string,
): PisoNivelDraft {
  return {
    id: createPisoId(),
    etiqueta: etiqueta ?? (esBase ? "Base" : "Piso"),
    anchoCm: "60",
    largoCm: "40",
    esBase,
    conColumnas: false,
    soporte: null,
    conCasita: false,
    casita: null,
    posicionCm: null,
  };
}

export function findBaseDraftIndex(
  pisos: Array<Pick<PisoNivelDraft, "esBase">>,
): number {
  return pisos.findIndex((p) => p.esBase);
}

/** Cualquier piso del modelo puede tener columnas o casita sobre su tabla. */
export function pisoSoportaNivelArriba(
  _index: number,
  pisos: Array<Pick<PisoNivelDraft, "esBase">>,
): boolean {
  return pisos.length >= 1;
}

/** Número de piso elevado: 1 = primero sobre la base. */
export function getPisoElevadoNumero(
  index: number,
  pisos: Array<Pick<PisoNivelDraft, "esBase">>,
): number {
  const baseIndex = findBaseDraftIndex(pisos);
  if (baseIndex < 0) return index + 1;
  if (pisos[index]?.esBase) return 0;
  return baseIndex - index;
}

/** La base siempre queda al final del array (abajo en la lista). */
export function normalizeDraftPisos(pisos: PisoNivelDraft[]): PisoNivelDraft[] {
  if (pisos.length === 0) return pisos;

  let baseIdx = findBaseDraftIndex(pisos);
  if (baseIdx < 0) {
    return pisos.map((p, i) => ({
      ...p,
      esBase: i === pisos.length - 1,
    }));
  }

  if (baseIdx === pisos.length - 1) {
    return pisos.map((p, i) => ({ ...p, esBase: i === baseIdx }));
  }

  const base = pisos[baseIdx];
  const elevados = pisos
    .filter((_, i) => i !== baseIdx)
    .map((p) => ({ ...p, esBase: false as const }));
  return [...elevados, { ...base, esBase: true }];
}

export function createDefaultSoporteDraft(
  pisoAnchoCm = 60,
  pisoLargoCm = 40,
): SoporteTramoDraft {
  return soporteToDraft(
    withDefaultPositions(DEFAULT_SOPORTE_TRAMO, pisoAnchoCm, pisoLargoCm),
  );
}
