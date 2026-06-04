"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { getDisplayUsername } from "@/lib/auth/display";
import { startPageNavigation } from "@/lib/navigation-loading";
import EnsambleCotizacionPanel from "@/components/admin/EnsambleCotizacionPanel";
import EnsambleRascadorPreview from "@/components/admin/EnsambleRascadorPreview";
import { buildQuoteProductOptions } from "@/lib/materials/quote-products";
import { DEFAULT_ENSAMBLE_COTIZACION_PREFS } from "@/lib/ensamble/cotizacion-prefs";
import type { EnsambleCotizacionPrefs } from "@/lib/ensamble/types";
import type { CommittedQuoteLine } from "@/lib/materials/quote-line";
import type { StockEntry } from "@/lib/materials/types";
import {
  computeRascadorEnsamble,
  configToDraftPisos,
  centerPisoPosicionDraft,
  createDefaultCasitaEnPisoDraft,
  createDefaultPisoPosicionDraft,
  createDefaultSoporteDraft,
  createEmptyPisoDraft,
  createPisoId,
  draftPisosToConfig,
  getPisoElevadoNumero,
  normalizeDraftPisos,
  MADERA_ESPESOR_MM,
  parsePositiveCm,
  redistributeSoporteDraftPositions,
  syncCasitaDraftPosition,
  syncSoporteDraftPositions,
  type CasitaEnPisoDraft,
  type ColumnaPosicionDraft,
  type PisoPosicionDraft,
  type PisoNivelDraft,
  type RascadorEnsambleConfig,
  type SoporteTramoDraft,
} from "@/lib/ensamble/cat-scratcher";

const inputClassName =
  "rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-normal text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

const labelClassName =
  "flex flex-col gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300";

const compactLabelClassName =
  "flex min-w-0 flex-col gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400";

const compactInputClassName = `${inputClassName} w-full min-w-0`;

/** Ancho y largo (u otro par de medidas) en una sola fila cuando hay espacio. */
const medidasEnLineaClassName = "grid min-w-0 grid-cols-2 gap-3";

type CollapsiblePanelProps = {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  headerAside?: ReactNode;
  children: ReactNode;
  className?: string;
};

function CollapsiblePanel({
  title,
  subtitle,
  expanded,
  onToggle,
  headerAside,
  children,
  className = "",
}: CollapsiblePanelProps) {
  return (
    <div
      className={`min-w-0 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 ${className}`}
    >
      <div className="flex items-start gap-1 border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/40">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-start gap-2 px-3 py-2.5 text-left transition hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60"
        >
          <span
            className={`mt-0.5 shrink-0 text-xs text-zinc-500 transition-transform dark:text-zinc-400 ${
              expanded ? "rotate-90" : ""
            }`}
            aria-hidden
          >
            ▶
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {title}
            </span>
            {!expanded && subtitle && (
              <span className="mt-0.5 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                {subtitle}
              </span>
            )}
          </span>
        </button>
        {headerAside && (
          <div className="flex shrink-0 items-center gap-1 px-2 py-2">{headerAside}</div>
        )}
      </div>
      {expanded && <div className="p-3">{children}</div>}
    </div>
  );
}

function formatPiezaMedidas(
  ancho: number,
  largo: number,
  alto: number,
): string {
  return `${ancho} × ${largo} × ${alto} cm`;
}

function updateSoporteCantidad(
  soporte: SoporteTramoDraft,
  count: number,
  pisoAnchoCm: number,
  pisoLargoCm: number,
): SoporteTramoDraft {
  return syncSoporteDraftPositions(
    { ...soporte, columnaCantidad: String(count) },
    pisoAnchoCm,
    pisoLargoCm,
  );
}

function SoporteTramoFields({
  soporte,
  pisoInferiorAnchoCm,
  pisoInferiorLargoCm,
  disabled = false,
  onChange,
}: {
  soporte: SoporteTramoDraft;
  pisoInferiorAnchoCm: number;
  pisoInferiorLargoCm: number;
  disabled?: boolean;
  onChange: (next: SoporteTramoDraft) => void;
}) {
  const updatePosicion = (
    index: number,
    patch: Partial<ColumnaPosicionDraft>,
  ) => {
    const next = soporte.columnaPosiciones.map((pos, i) =>
      i === index ? { ...pos, ...patch } : pos,
    );
    onChange({ ...soporte, columnaPosiciones: next });
  };

  const [soporteOpen, setSoporteOpen] = useState(true);
  const [posicionOpen, setPosicionOpen] = useState(true);

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
      <CollapsiblePanel
        title="Columnas sobre este piso"
        subtitle={`${soporte.columnaCantidad} col. · ${soporte.columnaAltoCm} cm alto`}
        expanded={soporteOpen}
        onToggle={() => setSoporteOpen((v) => !v)}
        className="border-zinc-200 dark:border-zinc-700"
      >
      <div className="flex min-w-0 flex-col gap-3">
        <div className={medidasEnLineaClassName}>
          <label className={labelClassName}>
            Cant. columnas
            <input
              type="number"
              min="1"
              max="8"
              value={soporte.columnaCantidad}
              onChange={(e) =>
                onChange(
                  updateSoporteCantidad(
                    soporte,
                    Math.max(1, Math.floor(Number(e.target.value) || 1)),
                    pisoInferiorAnchoCm,
                    pisoInferiorLargoCm,
                  ),
                )
              }
              disabled={disabled}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Alto del tramo (cm)
            <input
              type="number"
              min="1"
              step="any"
              value={soporte.columnaAltoCm}
              onChange={(e) =>
                onChange({ ...soporte, columnaAltoCm: e.target.value })
              }
              disabled={disabled}
              className={inputClassName}
            />
          </label>
        </div>
        <label className={labelClassName}>
          Diámetro (cm)
          <input
            type="number"
            min="1"
            step="any"
            value={soporte.columnaDiametroCm}
            onChange={(e) =>
              onChange({ ...soporte, columnaDiametroCm: e.target.value })
            }
            disabled={disabled}
            className={inputClassName}
          />
        </label>
      </div>
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Posición de columnas en este piso"
        subtitle={`${pisoInferiorAnchoCm}×${pisoInferiorLargoCm} cm · X/Y por columna`}
        expanded={posicionOpen}
        onToggle={() => setPosicionOpen((v) => !v)}
        className="border-zinc-200 dark:border-zinc-700"
        headerAside={
          !disabled ? (
            <button
              type="button"
              onClick={() =>
                onChange(
                  redistributeSoporteDraftPositions(
                    soporte,
                    pisoInferiorAnchoCm,
                    pisoInferiorLargoCm,
                  ),
                )
              }
              className="text-xs font-medium text-amber-700 dark:text-amber-400"
            >
              Repartir
            </button>
          ) : undefined
        }
      >
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          X = desde la izquierda · Y = desde el frente
        </p>
        <ul className="flex flex-col gap-2">
          {soporte.columnaPosiciones.map((pos, index) => (
            <li
              key={`pos-${index}`}
              className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950"
            >
              <p className="mb-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Columna {index + 1}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <label className={compactLabelClassName}>
                  X (cm)
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={pos.xCm}
                    onChange={(e) =>
                      updatePosicion(index, { xCm: e.target.value })
                    }
                    disabled={disabled}
                    className={compactInputClassName}
                  />
                </label>
                <label className={compactLabelClassName}>
                  Y (cm)
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={pos.yCm}
                    onChange={(e) =>
                      updatePosicion(index, { yCm: e.target.value })
                    }
                    disabled={disabled}
                    className={compactInputClassName}
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      </CollapsiblePanel>
    </div>
  );
}

function CasitaEnPisoFields({
  casita,
  pisoAnchoCm,
  pisoLargoCm,
  disabled = false,
  onChange,
}: {
  casita: CasitaEnPisoDraft;
  pisoAnchoCm: number;
  pisoLargoCm: number;
  disabled?: boolean;
  onChange: (next: CasitaEnPisoDraft) => void;
}) {
  const [medidasOpen, setMedidasOpen] = useState(true);
  const [posicionOpen, setPosicionOpen] = useState(true);

  const syncPosicionTrasMedidas = (draft: CasitaEnPisoDraft) => {
    onChange(
      syncCasitaDraftPosition(
        draft,
        pisoAnchoCm,
        pisoLargoCm,
        parsePositiveCm(draft.anchoCm, 28),
        parsePositiveCm(draft.largoCm, 28),
      ),
    );
  };

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-zinc-200 pt-3 dark:border-zinc-700">
      <CollapsiblePanel
        title="Casita (frente, fondo, laterales, techo)"
        subtitle={`${casita.anchoCm}×${casita.largoCm}×${casita.altoCm} cm`}
        expanded={medidasOpen}
        onToggle={() => setMedidasOpen((v) => !v)}
        className="border-zinc-200 dark:border-zinc-700"
      >
        <div className={medidasEnLineaClassName}>
          <label className={labelClassName}>
            Ancho (cm)
            <input
              type="number"
              min="1"
              step="any"
              value={casita.anchoCm}
              onChange={(e) =>
                onChange({ ...casita, anchoCm: e.target.value })
              }
              onBlur={(e) =>
                syncPosicionTrasMedidas({
                  ...casita,
                  anchoCm: e.target.value,
                })
              }
              disabled={disabled}
              className={inputClassName}
            />
          </label>
          <label className={labelClassName}>
            Largo (cm)
            <input
              type="number"
              min="1"
              step="any"
              value={casita.largoCm}
              onChange={(e) =>
                onChange({ ...casita, largoCm: e.target.value })
              }
              onBlur={(e) =>
                syncPosicionTrasMedidas({
                  ...casita,
                  largoCm: e.target.value,
                })
              }
              disabled={disabled}
              className={inputClassName}
            />
          </label>
        </div>
        <label className={`${labelClassName} mt-3`}>
          Alto cuerpo (cm)
          <input
            type="number"
            min="1"
            step="any"
            value={casita.altoCm}
            onChange={(e) => onChange({ ...casita, altoCm: e.target.value })}
            disabled={disabled}
            className={inputClassName}
          />
        </label>
        <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={casita.columnaEnTecho}
            onChange={(e) =>
              onChange({ ...casita, columnaEnTecho: e.target.checked })
            }
            disabled={disabled}
            className="rounded border-zinc-300 text-violet-700 focus:ring-violet-600"
          />
          Columna sobre el techo
        </label>
        {casita.columnaEnTecho && (
          <div className={`${medidasEnLineaClassName} mt-3`}>
            <label className={labelClassName}>
              Alto columna (cm)
              <input
                type="number"
                min="1"
                step="any"
                value={casita.columnaAltoCm}
                onChange={(e) =>
                  onChange({ ...casita, columnaAltoCm: e.target.value })
                }
                disabled={disabled}
                className={inputClassName}
              />
            </label>
            <label className={labelClassName}>
              Diámetro (cm)
              <input
                type="number"
                min="1"
                step="any"
                value={casita.columnaDiametroCm}
                onChange={(e) =>
                  onChange({ ...casita, columnaDiametroCm: e.target.value })
                }
                disabled={disabled}
                className={inputClassName}
              />
            </label>
          </div>
        )}
      </CollapsiblePanel>

      <CollapsiblePanel
        title="Posición de la casita en el plano"
        subtitle={`${pisoAnchoCm}×${pisoLargoCm} cm · X/Y centro`}
        expanded={posicionOpen}
        onToggle={() => setPosicionOpen((v) => !v)}
        className="border-zinc-200 dark:border-zinc-700"
        headerAside={
          !disabled ? (
            <button
              type="button"
              onClick={() =>
                onChange(createDefaultCasitaEnPisoDraft(pisoAnchoCm, pisoLargoCm))
              }
              className="text-xs font-medium text-amber-700 dark:text-amber-400"
            >
              Centrar
            </button>
          ) : undefined
        }
      >
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          X = desde la izquierda · Y = desde el frente (igual que las columnas)
        </p>
        <div className="grid grid-cols-2 gap-2">
          <label className={compactLabelClassName}>
            X (cm)
            <input
              type="number"
              min="0"
              step="any"
              value={casita.posicionCm.xCm}
              onChange={(e) =>
                onChange({
                  ...casita,
                  posicionCm: { ...casita.posicionCm, xCm: e.target.value },
                })
              }
              disabled={disabled}
              className={compactInputClassName}
            />
          </label>
          <label className={compactLabelClassName}>
            Y (cm)
            <input
              type="number"
              min="0"
              step="any"
              value={casita.posicionCm.yCm}
              onChange={(e) =>
                onChange({
                  ...casita,
                  posicionCm: { ...casita.posicionCm, yCm: e.target.value },
                })
              }
              disabled={disabled}
              className={compactInputClassName}
            />
          </label>
        </div>
      </CollapsiblePanel>
    </div>
  );
}

function draftHasBase(pisos: PisoNivelDraft[]): boolean {
  return pisos.some((p) => p.esBase);
}

function buildPisoSubtitle(
  piso: PisoNivelDraft,
  soporte: SoporteTramoDraft,
): string {
  const dims = `${piso.etiqueta} · ${piso.anchoCm}×${piso.largoCm} cm`;
  const parts: string[] = [];
  if (piso.conColumnas) {
    parts.push(`${soporte.columnaCantidad} col.`);
  }
  if (piso.conCasita && piso.casita) {
    parts.push(
      `casita ${piso.casita.anchoCm}×${piso.casita.largoCm}×${piso.casita.altoCm}`,
    );
  }
  if (parts.length === 0) return dims;
  const pos = piso.posicionCm
    ? ` · X ${piso.posicionCm.xCm} Y ${piso.posicionCm.yCm}`
    : piso.conCasita && piso.casita
      ? ` · casita X ${piso.casita.posicionCm.xCm} Y ${piso.casita.posicionCm.yCm}`
      : "";
  return `${dims} · ${parts.join(" · ")}${pos}`;
}

function PisoPosicionFields({
  posicion,
  pisoInferiorAnchoCm,
  pisoInferiorLargoCm,
  pisoAnchoCm,
  pisoLargoCm,
  disabled = false,
  onChange,
}: {
  posicion: PisoPosicionDraft;
  pisoInferiorAnchoCm: number;
  pisoInferiorLargoCm: number;
  pisoAnchoCm: number;
  pisoLargoCm: number;
  disabled?: boolean;
  onChange: (next: PisoPosicionDraft) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <CollapsiblePanel
      title="Posición en piso de abajo"
      subtitle={`${pisoInferiorAnchoCm}×${pisoInferiorLargoCm} cm · centro del piso`}
      expanded={open}
      onToggle={() => setOpen((v) => !v)}
      className="mt-3 border-zinc-200 dark:border-zinc-700"
      headerAside={
        !disabled ? (
          <button
            type="button"
            onClick={() =>
              onChange(
                centerPisoPosicionDraft(
                  posicion,
                  pisoInferiorAnchoCm,
                  pisoInferiorLargoCm,
                ),
              )
            }
            className="text-xs font-medium text-amber-700 dark:text-amber-400"
          >
            Centrar
          </button>
        ) : undefined
      }
    >
      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
        X = desde la izquierda del piso inferior · Y = desde el frente
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className={compactLabelClassName}>
          X (cm)
          <input
            type="number"
            min="0"
            step="any"
            value={posicion.xCm}
            onChange={(e) => onChange({ ...posicion, xCm: e.target.value })}
            disabled={disabled}
            className={compactInputClassName}
          />
        </label>
        <label className={compactLabelClassName}>
          Y (cm)
          <input
            type="number"
            min="0"
            step="any"
            value={posicion.yCm}
            onChange={(e) => onChange({ ...posicion, yCm: e.target.value })}
            disabled={disabled}
            className={compactInputClassName}
          />
        </label>
      </div>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Pieza {pisoAnchoCm}×{pisoLargoCm} cm sobre el piso inferior.
      </p>
    </CollapsiblePanel>
  );
}

function initialPisoExpanded(pisos: PisoNivelDraft[]): Record<string, boolean> {
  return Object.fromEntries(pisos.map((p) => [p.id, true]));
}

type EnsambleRascadorProps = {
  mode: "create" | "edit";
  ensambleId?: string;
  initialConfig: RascadorEnsambleConfig;
  initialDescripcion?: string;
  initialMateriales?: CommittedQuoteLine[];
  initialCotizacionPrefs?: EnsambleCotizacionPrefs;
  stockEntries: StockEntry[];
  canEdit: boolean;
  canWrite: boolean;
  createdBy?: string;
};

export default function EnsambleRascador({
  mode,
  ensambleId,
  initialConfig,
  initialDescripcion = "",
  initialMateriales = [],
  initialCotizacionPrefs = DEFAULT_ENSAMBLE_COTIZACION_PREFS,
  stockEntries,
  canEdit,
  canWrite,
  createdBy,
}: EnsambleRascadorProps) {
  const router = useRouter();
  const [nombre, setNombre] = useState(initialConfig.nombre);
  const [pisosDraft, setPisosDraft] = useState<PisoNivelDraft[]>(() =>
    normalizeDraftPisos(configToDraftPisos(initialConfig)),
  );
  const [pisoExpanded, setPisoExpanded] = useState<Record<string, boolean>>(() =>
    initialPisoExpanded(configToDraftPisos(initialConfig)),
  );
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const [piezasExpanded, setPiezasExpanded] = useState(true);
  const [cotizacionExpanded, setCotizacionExpanded] = useState(true);
  const [descripcion, setDescripcion] = useState(initialDescripcion);
  const [materiales, setMateriales] =
    useState<CommittedQuoteLine[]>(initialMateriales);
  const [cotizacionPrefs, setCotizacionPrefs] = useState(
    initialCotizacionPrefs,
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldDisabled = !canEdit;

  const computed = useMemo(
    () => computeRascadorEnsamble(draftPisosToConfig(nombre, pisosDraft)),
    [nombre, pisosDraft],
  );

  const quoteProducts = useMemo(
    () => buildQuoteProductOptions(stockEntries),
    [stockEntries],
  );
  const productMap = useMemo(
    () => new Map(quoteProducts.map((p) => [p.key, p])),
    [quoteProducts],
  );

  const setPisosDraftNormalized = (
    updater: (current: PisoNivelDraft[]) => PisoNivelDraft[],
  ) => {
    setPisosDraft((current) => normalizeDraftPisos(updater(current)));
  };

  const updatePiso = (id: string, patch: Partial<PisoNivelDraft>) => {
    setPisosDraftNormalized((current) =>
      current.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  };

  const addPisoElevado = (conColumnas: boolean) => {
    const insertIndex = draftHasBase(pisosDraft)
      ? pisosDraft.length - 1
      : 0;
    const inferior = draftHasBase(pisosDraft)
      ? pisosDraft[pisosDraft.length - 1]
      : pisosDraft[0];
    const infAncho = inferior
      ? parsePositiveCm(inferior.anchoCm, 60)
      : 60;
    const infLargo = inferior
      ? parsePositiveCm(inferior.largoCm, 40)
      : 40;
    const pisoAncho = inferior ? inferior.anchoCm : "50";
    const pisoLargo = inferior ? inferior.largoCm : "40";
    const numero = pisosDraft.filter((p) => !p.esBase).length + 1;
    const id = createPisoId();
    const nuevo: PisoNivelDraft = {
      ...createEmptyPisoDraft(false, `Piso ${numero}`),
      id,
      etiqueta: `Piso ${numero}`,
      anchoCm: pisoAncho,
      largoCm: pisoLargo,
      conColumnas,
      soporte: conColumnas
        ? createDefaultSoporteDraft(infAncho, infLargo)
        : null,
      posicionCm: createDefaultPisoPosicionDraft(infAncho, infLargo),
    };
    setPisosDraftNormalized((current) => [
      ...current.slice(0, insertIndex),
      nuevo,
      ...current.slice(insertIndex),
    ]);
    setPisoExpanded((current) => ({ ...current, [id]: true }));
  };

  const addBase = (conColumnas = false) => {
    if (draftHasBase(pisosDraft)) return;
    const ancho = pisosDraft[0]?.anchoCm ?? "60";
    const largo = pisosDraft[0]?.largoCm ?? "40";
    const hostAncho = parsePositiveCm(ancho, 60);
    const hostLargo = parsePositiveCm(largo, 40);
    const base: PisoNivelDraft = {
      ...createEmptyPisoDraft(true),
      anchoCm: ancho,
      largoCm: largo,
      conColumnas,
      soporte: conColumnas
        ? createDefaultSoporteDraft(hostAncho, hostLargo)
        : null,
    };
    setPisosDraftNormalized((current) => [...current, base]);
    setPisoExpanded((current) => ({ ...current, [base.id]: true }));
  };

  const removePiso = (id: string) => {
    setPisosDraftNormalized((current) => current.filter((p) => p.id !== id));
    setPisoExpanded((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const setAllPisosExpanded = (expanded: boolean) => {
    setPisoExpanded(
      Object.fromEntries(pisosDraft.map((p) => [p.id, expanded])),
    );
  };

  const hasContentToSave = pisosDraft.length > 0;

  const buildConfig = (): RascadorEnsambleConfig =>
    draftPisosToConfig(nombre, pisosDraft);

  const handleSave = async () => {
    if (!canEdit) return;

    setSaving(true);
    setError(null);

    const payload = {
      tipo: "rascador-gatos" as const,
      config: buildConfig(),
      descripcion,
      materiales,
      cotizacionPrefs,
    };

    try {
      if (mode === "create") {
        const response = await fetch("/api/ensamble", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "No se pudo guardar el ensamble.");
          return;
        }
        startPageNavigation();
        router.push(`/admin/ensamble/${data.id}`);
        router.refresh();
        return;
      }

      if (!ensambleId) return;

      const response = await fetch(`/api/ensamble/${ensambleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "No se pudo guardar el ensamble.");
        return;
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit || mode !== "edit" || !ensambleId) return;

    const confirmDelete = window.confirm(
      "¿Eliminar este ensamble? No se puede deshacer.",
    );
    if (!confirmDelete) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/ensamble/${ensambleId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "No se pudo eliminar el ensamble.");
        return;
      }
      startPageNavigation();
      router.push("/admin/ensamble");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  const viewOnlyNote =
    !canEdit && mode === "edit" && canWrite && createdBy
      ? `Solo ${getDisplayUsername(createdBy)} puede editar este ensamble.`
      : !canEdit && mode === "edit"
        ? "Este ensamble es de solo lectura para tu usuario."
        : undefined;

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <Link
          href="/admin/ensamble"
          className="text-sm font-medium text-amber-700 transition hover:text-amber-800 dark:text-amber-400"
        >
          ← Ensambles
        </Link>
        <p className="mt-4 text-sm font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Administración
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {mode === "create"
            ? "Nuevo ensamble · Rascador gatos"
            : `Ensamble · ${computed.config.nombre}`}
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Apilá pisos como en los rascadores de referencia: base en el suelo,
          columnas (o casita) entre niveles y plataformas más chicas hacia arriba.
          Madera fija de {MADERA_ESPESOR_MM} mm.
        </p>
        {viewOnlyNote && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            {viewOnlyNote}
          </p>
        )}
        {error && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {canEdit && (
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasContentToSave || saving || deleting}
              title={
                hasContentToSave
                  ? undefined
                  : "Agregá la base o al menos un piso para guardar"
              }
              className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-700 px-4 text-sm font-medium text-white transition hover:bg-amber-800 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            {mode === "edit" && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-red-300 px-4 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                {deleting ? "Eliminando…" : "Eliminar"}
              </button>
            )}
          </div>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="flex min-w-0 flex-col gap-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                Pisos del modelo
              </h2>
              {canEdit && (
                <div className="flex flex-wrap gap-2">
                  {!draftHasBase(pisosDraft) ? (
                    <button
                      type="button"
                      onClick={() => addBase(false)}
                      className="text-sm font-medium text-amber-700 transition hover:text-amber-800 dark:text-amber-400"
                    >
                      + Base
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addPisoElevado(false)}
                      className="text-sm font-medium text-amber-700 transition hover:text-amber-800 dark:text-amber-400"
                    >
                      + Piso
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <button
                type="button"
                onClick={() => setAllPisosExpanded(true)}
                className="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Expandir todos
              </button>
              <button
                type="button"
                onClick={() => setAllPisosExpanded(false)}
                className="font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Colapsar todos
              </button>
            </div>
          </div>

          <label className={labelClassName}>
            Nombre del diseño
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={fieldDisabled}
              className={inputClassName}
            />
          </label>

          {pisosDraft.length === 0 && (
            <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              Primero agregá la <strong>Base</strong>, después los pisos (Piso 1,
              Piso 2…). La base queda al final de la lista.
            </p>
          )}

          <ul className="flex flex-col gap-4">
            {pisosDraft.map((piso, index) => {
              const esBase = piso.esBase;
              const tienePisoAbajo = index < pisosDraft.length - 1;
              const pisoInferior = tienePisoAbajo
                ? pisosDraft[index + 1]
                : undefined;
              const infAncho = pisoInferior
                ? parsePositiveCm(pisoInferior.anchoCm, 60)
                : 60;
              const infLargo = pisoInferior
                ? parsePositiveCm(pisoInferior.largoCm, 40)
                : 40;
              const pisoAncho = parsePositiveCm(piso.anchoCm, 50);
              const pisoLargo = parsePositiveCm(piso.largoCm, 40);
              const casitaDraft =
                piso.casita ??
                createDefaultCasitaEnPisoDraft(pisoAncho, pisoLargo);
              const soporte =
                piso.soporte ??
                createDefaultSoporteDraft(pisoAncho, pisoLargo);
              const posicion =
                piso.posicionCm ??
                createDefaultPisoPosicionDraft(infAncho, infLargo);

              const title = esBase
                ? "Base (suelo)"
                : `Piso ${getPisoElevadoNumero(index, pisosDraft)}`;
              const expanded = pisoExpanded[piso.id] ?? true;

              return (
                <li key={piso.id} className="min-w-0">
                  <CollapsiblePanel
                    title={title}
                    subtitle={buildPisoSubtitle(piso, soporte)}
                    expanded={expanded}
                    onToggle={() =>
                      setPisoExpanded((current) => ({
                        ...current,
                        [piso.id]: !expanded,
                      }))
                    }
                    headerAside={
                      canEdit ? (
                        <button
                          type="button"
                          onClick={() => removePiso(piso.id)}
                          className="text-xs font-medium text-red-600 dark:text-red-400"
                        >
                          Quitar
                        </button>
                      ) : undefined
                    }
                  >
                  <div className="flex min-w-0 flex-col gap-3">
                    <label className={labelClassName}>
                      Etiqueta
                      <input
                        type="text"
                        value={piso.etiqueta}
                        onChange={(e) =>
                          updatePiso(piso.id, { etiqueta: e.target.value })
                        }
                        disabled={fieldDisabled}
                        className={inputClassName}
                      />
                    </label>
                    <div className={medidasEnLineaClassName}>
                      <label className={labelClassName}>
                        Ancho (cm)
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={piso.anchoCm}
                          onChange={(e) =>
                            updatePiso(piso.id, { anchoCm: e.target.value })
                          }
                          disabled={fieldDisabled}
                          className={inputClassName}
                        />
                      </label>
                      <label className={labelClassName}>
                        Largo (cm)
                        <input
                          type="number"
                          min="1"
                          step="any"
                          value={piso.largoCm}
                          onChange={(e) =>
                            updatePiso(piso.id, { largoCm: e.target.value })
                          }
                          disabled={fieldDisabled}
                          className={inputClassName}
                        />
                      </label>
                    </div>
                  </div>

                  <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={piso.conColumnas}
                      disabled={fieldDisabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const hostAncho = parsePositiveCm(piso.anchoCm, 60);
                        const hostLargo = parsePositiveCm(piso.largoCm, 40);
                        updatePiso(piso.id, {
                          conColumnas: checked,
                          soporte: checked
                            ? createDefaultSoporteDraft(hostAncho, hostLargo)
                            : null,
                        });
                      }}
                      className="rounded border-zinc-300 text-amber-700 focus:ring-amber-600"
                    />
                    Columnas sobre esta tabla
                  </label>

                  {piso.conColumnas && (
                    <SoporteTramoFields
                      soporte={soporte}
                      pisoInferiorAnchoCm={pisoAncho}
                      pisoInferiorLargoCm={pisoLargo}
                      disabled={fieldDisabled}
                      onChange={(next) =>
                        updatePiso(piso.id, { soporte: next })
                      }
                    />
                  )}

                  <label className="mt-3 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={piso.conCasita}
                      disabled={fieldDisabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const hostAncho = parsePositiveCm(piso.anchoCm, 60);
                        const hostLargo = parsePositiveCm(piso.largoCm, 40);
                        updatePiso(piso.id, {
                          conCasita: checked,
                          casita: checked
                            ? createDefaultCasitaEnPisoDraft(
                                hostAncho,
                                hostLargo,
                              )
                            : null,
                        });
                      }}
                      className="rounded border-zinc-300 text-violet-700 focus:ring-violet-600"
                    />
                    Casita sobre esta tabla
                  </label>

                  {piso.conCasita && (
                    <CasitaEnPisoFields
                      casita={casitaDraft}
                      pisoAnchoCm={pisoAncho}
                      pisoLargoCm={pisoLargo}
                      disabled={fieldDisabled}
                      onChange={(next) =>
                        updatePiso(piso.id, { casita: next })
                      }
                    />
                  )}

                  {tienePisoAbajo && pisoInferior && (
                    <PisoPosicionFields
                      posicion={posicion}
                      pisoInferiorAnchoCm={infAncho}
                      pisoInferiorLargoCm={infLargo}
                      pisoAnchoCm={pisoAncho}
                      pisoLargoCm={pisoLargo}
                      disabled={fieldDisabled}
                      onChange={(next) =>
                        updatePiso(piso.id, { posicionCm: next })
                      }
                    />
                  )}
                  </CollapsiblePanel>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex min-w-0 flex-col gap-6">
          <CollapsiblePanel
            title={`Vista previa · ${computed.config.nombre || "Sin nombre"}`}
            subtitle={
              computed.niveles.length === 0
                ? "Sin pisos configurados"
                : `${computed.niveles.length} pisos · ${computed.alturaTotalCm.toFixed(0)} cm alto`
            }
            expanded={previewExpanded}
            onToggle={() => setPreviewExpanded((v) => !v)}
          >
            <EnsambleRascadorPreview computed={computed} />
          </CollapsiblePanel>

          <CollapsiblePanel
            title={`Piezas para fabricar (${computed.piezas.length})`}
            subtitle="Listado de madera por nivel"
            expanded={piezasExpanded}
            onToggle={() => setPiezasExpanded((v) => !v)}
          >
            {computed.piezas.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Todavía no hay piezas. Configurá al menos un piso para generar el
                listado.
              </p>
            ) : (
            <ul className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {computed.piezas.map((pieza) => (
                <li
                  key={pieza.id}
                  className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm dark:border-zinc-800"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                      {pieza.etiqueta}
                    </span>
                    <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
                      {pieza.cantidad} ×{" "}
                      {formatPiezaMedidas(
                        pieza.anchoCm,
                        pieza.largoCm,
                        pieza.altoCm,
                      )}
                    </span>
                  </div>
                  {pieza.notas && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {pieza.notas}
                    </p>
                  )}
                </li>
              ))}
            </ul>
            )}
          </CollapsiblePanel>
        </div>
      </div>

      <CollapsiblePanel
        title="Cotización (materiales)"
        subtitle={
          materiales.length === 0
            ? "Tela, hilo, tornillos y stock"
            : `${materiales.length} materiales cotizados`
        }
        expanded={cotizacionExpanded}
        onToggle={() => setCotizacionExpanded((v) => !v)}
        className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        {quoteProducts.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No hay productos en stock marcados para cotizador.{" "}
            <Link
              href="/admin/stock"
              className="font-medium text-amber-700 dark:text-amber-400"
            >
              Cargá stock
            </Link>{" "}
            con &quot;Usar en cotizador&quot;.
          </p>
        ) : (
          <EnsambleCotizacionPanel
            config={computed.config}
            descripcion={descripcion}
            materiales={materiales}
            cotizacionPrefs={cotizacionPrefs}
            products={quoteProducts}
            productMap={productMap}
            canEdit={canEdit}
            onDescripcionChange={setDescripcion}
            onMaterialesChange={setMateriales}
            onPrefsChange={setCotizacionPrefs}
          />
        )}
      </CollapsiblePanel>
    </div>
  );
}
