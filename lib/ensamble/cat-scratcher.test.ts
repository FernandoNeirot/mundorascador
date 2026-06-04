import { describe, expect, it } from "vitest";
import {
  CASITA_HEIGHT_RATIO,
  computeRascadorEnsamble,
  createPisoNivel,
  DEFAULT_RASCADOR_CONFIG,
  getPisoElevadoNumero,
  normalizeCasitaEnPiso,
  normalizeSoporteTramo,
  pisoSoportaNivelArriba,
  withDefaultPositions,
} from "./cat-scratcher";

describe("computeRascadorEnsamble", () => {
  it("apila pisos y genera tramos entre niveles", () => {
    const soporte = withDefaultPositions(
      {
        columnaCantidad: 2,
        columnaAltoCm: 30,
        columnaDiametroCm: 8,
        casitaActiva: true,
        casitaColumnaIndice: 1,
        casitaAnchoCm: 25,
        casitaProfundoCm: 25,
      },
      60,
      40,
    );

    const result = computeRascadorEnsamble({
      nombre: "Test",
      pisos: [
        createPisoNivel("Arriba", 50, 40),
        createPisoNivel("Base", 60, 40, soporte),
      ],
    });

    expect(result.niveles).toHaveLength(2);
    const base = result.niveles.find((n) => n.esBase);
    expect(base?.tramo?.soporte.columnaAltoCm).toBe(30);
    expect(result.piezas.filter((p) => p.rol === "piso")).toHaveLength(2);
    expect(result.piezas.some((p) => p.rol === "casita")).toBe(true);
    expect(result.alturaTotalCm).toBeGreaterThan(30);
  });

  it("usa posiciones personalizadas de columnas", () => {
    const soporte = normalizeSoporteTramo(
      withDefaultPositions(
        {
          columnaCantidad: 2,
          columnaAltoCm: 20,
          columnaDiametroCm: 8,
          columnaPosiciones: [
            { xCm: 12, yCm: 10 },
            { xCm: 48, yCm: 30 },
          ],
          casitaActiva: false,
          casitaColumnaIndice: 1,
          casitaAnchoCm: 28,
          casitaProfundoCm: 28,
        },
        60,
        40,
      ),
      60,
      40,
    );

    const result = computeRascadorEnsamble({
      nombre: "Pos",
      pisos: [
        createPisoNivel("Nivel", 50, 40),
        createPisoNivel("Base", 60, 40, soporte),
      ],
    });

    const base = result.niveles.find((n) => n.esBase);
    const pos = base?.tramo?.columnaPosiciones;
    expect(pos?.[0].xCm).toBe(12);
    expect(pos?.[1].yCm).toBe(30);
  });

  it("el ejemplo por defecto tiene cuatro pisos", () => {
    const result = computeRascadorEnsamble(DEFAULT_RASCADOR_CONFIG);
    expect(result.niveles).toHaveLength(4);
    expect(result.piezas.filter((p) => p.rol === "piso")).toHaveLength(4);
  });

  it("columnas quedan en el piso portador (base puede tenerlas)", () => {
    const result = computeRascadorEnsamble({
      nombre: "Base col",
      pisos: [
        createPisoNivel("Arriba", 40, 40),
        createPisoNivel(
          "Base",
          60,
          40,
          withDefaultPositions(
            {
              columnaCantidad: 2,
              columnaAltoCm: 25,
              columnaDiametroCm: 8,
              casitaActiva: false,
              casitaColumnaIndice: 1,
              casitaAnchoCm: 28,
              casitaProfundoCm: 28,
            },
            60,
            40,
          ),
        ),
      ],
    });
    const base = result.niveles.find((n) => n.esBase);
    expect(base?.tramo).toBeDefined();
    expect(result.piezas.some((p) => p.rol === "columna")).toBe(true);
    expect(result.niveles.find((n) => n.piso.etiqueta === "Arriba")?.tramo).toBe(
      undefined,
    );
  });

  it("solo base con una columna (sin piso superior)", () => {
    const result = computeRascadorEnsamble({
      nombre: "Solo base",
      pisos: [
        createPisoNivel(
          "Base",
          60,
          40,
          withDefaultPositions(
            {
              columnaCantidad: 1,
              columnaAltoCm: 35,
              columnaDiametroCm: 8,
              casitaActiva: false,
              casitaColumnaIndice: 1,
              casitaAnchoCm: 28,
              casitaProfundoCm: 28,
            },
            60,
            40,
          ),
        ),
      ],
    });
    expect(result.niveles).toHaveLength(1);
    expect(result.niveles[0]?.tramo?.soporte.columnaCantidad).toBe(1);
    expect(result.piezas.filter((p) => p.rol === "columna")).toHaveLength(1);
    expect(result.alturaTotalCm).toBe(1.5 + 35);
  });

  it("casita en plano sobre la base genera piezas de caja", () => {
    const casita = normalizeCasitaEnPiso(
      {
        posicionCm: { xCm: 30, yCm: 20 },
        anchoCm: 28,
        largoCm: 26,
        altoCm: 22,
        columnaEnTecho: true,
        columnaAltoCm: 18,
        columnaDiametroCm: 8,
      },
      60,
      40,
    );
    const result = computeRascadorEnsamble({
      nombre: "Casita",
      pisos: [
        {
          ...createPisoNivel("Base", 60, 40),
          casita,
        },
      ],
    });
    const base = result.niveles.find((n) => n.esBase);
    expect(base?.casita?.config.anchoCm).toBe(28);
    expect(result.piezas.some((p) => p.rol === "casita-frente")).toBe(true);
    expect(result.piezas.some((p) => p.rol === "casita-lateral")).toBe(true);
    expect(result.piezas.some((p) => p.rol === "casita-techo")).toBe(true);
    expect(result.piezas.some((p) => p.rol === "casita-columna-techo")).toBe(
      true,
    );
  });

  it("migra soporte del piso superior al portador", () => {
    const migrated = computeRascadorEnsamble({
      nombre: "Mig",
      pisos: [
        createPisoNivel(
          "Arriba",
          50,
          40,
          withDefaultPositions(
            {
              columnaCantidad: 1,
              columnaAltoCm: 20,
              columnaDiametroCm: 8,
              casitaActiva: false,
              casitaColumnaIndice: 1,
              casitaAnchoCm: 28,
              casitaProfundoCm: 28,
            },
            60,
            40,
          ),
        ),
        createPisoNivel("Base", 60, 40),
      ],
    });
    expect(migrated.config.pisos[0]?.soporte).toBeUndefined();
    expect(migrated.config.pisos[1]?.soporte).toBeDefined();
    const base = migrated.niveles.find((n) => n.esBase);
    expect(base?.tramo?.soporte.columnaAltoCm).toBe(20);
  });

  it("migra orden viejo base-primero", () => {
    const legacy = computeRascadorEnsamble({
      nombre: "Legacy",
      pisos: [
        createPisoNivel("Base", 60, 40),
        createPisoNivel(
          "Arriba",
          50,
          40,
          withDefaultPositions(
            {
              columnaCantidad: 1,
              columnaAltoCm: 20,
              columnaDiametroCm: 8,
              casitaActiva: false,
              casitaColumnaIndice: 1,
              casitaAnchoCm: 28,
              casitaProfundoCm: 28,
            },
            60,
            40,
          ),
        ),
      ],
    });
    expect(legacy.niveles.find((n) => n.esBase)?.piso.etiqueta).toBe("Base");
    expect(legacy.niveles.find((n) => !n.esBase)?.piso.etiqueta).toBe("Arriba");
  });

  it("cualquier piso del modelo puede tener elementos en la tabla", () => {
    const soloBase = [{ esBase: true }] as { esBase: boolean }[];
    expect(pisoSoportaNivelArriba(0, soloBase)).toBe(true);
    const dos = [{ esBase: false }, { esBase: true }] as { esBase: boolean }[];
    expect(pisoSoportaNivelArriba(0, dos)).toBe(true);
    expect(pisoSoportaNivelArriba(1, dos)).toBe(true);
    expect(getPisoElevadoNumero(0, dos)).toBe(1);
  });

  it("pisos intermedios también pueden tener columnas", () => {
    const drafts = [
      { esBase: false },
      { esBase: false },
      { esBase: true },
    ] as { esBase: boolean }[];
    expect(pisoSoportaNivelArriba(1, drafts)).toBe(true);
    expect(pisoSoportaNivelArriba(2, drafts)).toBe(true);
  });

  it("acepta configuración vacía", () => {
    const result = computeRascadorEnsamble({ nombre: "", pisos: [] });
    expect(result.niveles).toHaveLength(0);
    expect(result.alturaTotalCm).toBe(0);
  });

  it("casita legacy en columna usa 80% del tramo", () => {
    const result = computeRascadorEnsamble(DEFAULT_RASCADOR_CONFIG);
    const nivelConCasita = result.niveles.find((n) => n.tramo?.soporte.casitaActiva);
    expect(nivelConCasita?.tramo?.casitaAltoCm).toBeCloseTo(
      (nivelConCasita?.tramo?.soporte.columnaAltoCm ?? 0) * CASITA_HEIGHT_RATIO,
      5,
    );
  });
});
