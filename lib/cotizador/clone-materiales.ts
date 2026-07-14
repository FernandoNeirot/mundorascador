import type { CommittedQuoteLine } from "@/lib/materials/quote-line";

/** Copia líneas de cotización con ids (y pairId) nuevos para no chocar con el original. */
export function cloneCotizacionMateriales(
  materiales: CommittedQuoteLine[],
): CommittedQuoteLine[] {
  const pairIdMap = new Map<string, string>();

  return materiales.map((line) => {
    let pairId = line.pairId;
    if (pairId) {
      const mapped = pairIdMap.get(pairId);
      if (mapped) {
        pairId = mapped;
      } else {
        const next = crypto.randomUUID();
        pairIdMap.set(pairId, next);
        pairId = next;
      }
    }

    return {
      ...line,
      id: crypto.randomUUID(),
      ...(pairId ? { pairId } : {}),
    };
  });
}
