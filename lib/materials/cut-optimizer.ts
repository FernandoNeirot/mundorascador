import { KERF_CM_PER_SIDE } from "./cortes";
import { superficieCm2FromDimensions } from "./superficie";

export type OptimizerMaterialType = "maderas" | "telas";

export type CutRequest = {
  id: string;
  anchoCm: number;
  largoCm: number;
  quantity: number;
  label: string;
};

export type PlacedCut = {
  placementId: string;
  cutId: string;
  label: string;
  x: number;
  y: number;
  /** Espacio reservado en la placa (corte + kerf de hoja). */
  footprintAnchoCm: number;
  footprintLargoCm: number;
  anchoCm: number;
  largoCm: number;
  rotated: boolean;
};

export type PackResult = {
  placed: PlacedCut[];
  unplaced: CutRequest[];
  sheetAnchoCm: number;
  sheetLargoCm: number;
  sheetAreaCm2: number;
  usedFootprintCm2: number;
  cutsAreaCm2: number;
  wasteCm2: number;
  efficiencyPercent: number;
  kerfCm: number;
};

type FreeRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PackItem = {
  id: string;
  cutId: string;
  label: string;
  anchoCm: number;
  largoCm: number;
};

type Orientation = {
  w: number;
  h: number;
  anchoCm: number;
  largoCm: number;
  rotated: boolean;
};

type SkylineNode = {
  x: number;
  y: number;
  width: number;
};

function getFootprintForOrientation(
  anchoCm: number,
  largoCm: number,
  sheetAnchoCm: number,
  sheetLargoCm: number,
): { w: number; h: number } {
  const spansSheetWidth = Math.abs(anchoCm - sheetAnchoCm) < 0.01;
  const spansSheetLength = Math.abs(largoCm - sheetLargoCm) < 0.01;

  return {
    w: spansSheetWidth ? anchoCm : anchoCm + KERF_CM_PER_SIDE,
    h: spansSheetLength ? largoCm : largoCm + KERF_CM_PER_SIDE,
  };
}

function expandCutRequests(cuts: CutRequest[]): PackItem[] {
  const items: PackItem[] = [];

  for (const cut of cuts) {
    const qty = Math.max(1, Math.floor(cut.quantity));
    for (let i = 0; i < qty; i += 1) {
      const label = qty > 1 ? `${cut.label} (${i + 1}/${qty})` : cut.label;
      items.push({
        id: `${cut.id}-${i}`,
        cutId: cut.id,
        label,
        anchoCm: cut.anchoCm,
        largoCm: cut.largoCm,
      });
    }
  }

  return items;
}

function rectContains(a: FreeRect, b: FreeRect): boolean {
  return (
    a.x <= b.x &&
    a.y <= b.y &&
    a.x + a.width >= b.x + b.width &&
    a.y + a.height >= b.y + b.height
  );
}

function pruneFreeRects(freeRects: FreeRect[]): FreeRect[] {
  return freeRects.filter(
    (rect, index) =>
      rect.width > 0.01 &&
      rect.height > 0.01 &&
      !freeRects.some(
        (other, otherIndex) =>
          otherIndex !== index && rectContains(other, rect),
      ),
  );
}

function splitFreeRect(
  free: FreeRect,
  placedW: number,
  placedH: number,
): FreeRect[] {
  return pruneFreeRects([
    {
      x: free.x + placedW,
      y: free.y,
      width: free.width - placedW,
      height: placedH,
    },
    {
      x: free.x,
      y: free.y + placedH,
      width: free.width,
      height: free.height - placedH,
    },
  ]);
}

function bestShortSideFit(
  freeRects: FreeRect[],
  width: number,
  height: number,
): { rectIndex: number; score: number } | null {
  let best: { rectIndex: number; score: number } | null = null;

  freeRects.forEach((rect, index) => {
    if (width > rect.width + 0.001 || height > rect.height + 0.001) return;

    const leftoverW = rect.width - width;
    const leftoverH = rect.height - height;
    const score = Math.min(leftoverW, leftoverH);

    if (!best || score < best.score) {
      best = { rectIndex: index, score };
    }
  });

  return best;
}

function getOrientations(
  item: PackItem,
  sheetAnchoCm: number,
  sheetLargoCm: number,
  allowRotation: boolean,
): Orientation[] {
  const normal = getFootprintForOrientation(
    item.anchoCm,
    item.largoCm,
    sheetAnchoCm,
    sheetLargoCm,
  );

  const orientations: Orientation[] = [
    {
      w: normal.w,
      h: normal.h,
      anchoCm: item.anchoCm,
      largoCm: item.largoCm,
      rotated: false,
    },
  ];

  if (allowRotation && Math.abs(item.anchoCm - item.largoCm) > 0.001) {
    const rotated = getFootprintForOrientation(
      item.largoCm,
      item.anchoCm,
      sheetAnchoCm,
      sheetLargoCm,
    );
    orientations.push({
      w: rotated.w,
      h: rotated.h,
      anchoCm: item.largoCm,
      largoCm: item.anchoCm,
      rotated: true,
    });
  }

  return orientations;
}

function itemArea(
  item: PackItem,
  sheetAnchoCm: number,
  sheetLargoCm: number,
): number {
  const fp = getFootprintForOrientation(
    item.anchoCm,
    item.largoCm,
    sheetAnchoCm,
    sheetLargoCm,
  );
  return fp.w * fp.h;
}

function itemMaxSide(
  item: PackItem,
  sheetAnchoCm: number,
  sheetLargoCm: number,
): number {
  const fp = getFootprintForOrientation(
    item.anchoCm,
    item.largoCm,
    sheetAnchoCm,
    sheetLargoCm,
  );
  return Math.max(fp.w, fp.h);
}

function itemFootprintWidth(
  item: PackItem,
  sheetAnchoCm: number,
  sheetLargoCm: number,
): number {
  return getFootprintForOrientation(
    item.anchoCm,
    item.largoCm,
    sheetAnchoCm,
    sheetLargoCm,
  ).w;
}

function itemFootprintHeight(
  item: PackItem,
  sheetAnchoCm: number,
  sheetLargoCm: number,
): number {
  return getFootprintForOrientation(
    item.anchoCm,
    item.largoCm,
    sheetAnchoCm,
    sheetLargoCm,
  ).h;
}

function packMaxRects(
  sheetAnchoCm: number,
  sheetLargoCm: number,
  items: PackItem[],
  allowRotation: boolean,
): { placed: PlacedCut[]; unplacedIds: Set<string> } {
  let freeRects: FreeRect[] = [
    { x: 0, y: 0, width: sheetAnchoCm, height: sheetLargoCm },
  ];
  const placed: PlacedCut[] = [];
  const unplacedIds = new Set<string>();

  for (const item of items) {
    const orientations = getOrientations(
      item,
      sheetAnchoCm,
      sheetLargoCm,
      allowRotation,
    );
    let chosen: {
      rectIndex: number;
      orientation: Orientation;
    } | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const orientation of orientations) {
      const fit = bestShortSideFit(freeRects, orientation.w, orientation.h);
      if (!fit || fit.score >= bestScore) continue;
      bestScore = fit.score;
      chosen = { rectIndex: fit.rectIndex, orientation };
    }

    if (!chosen) {
      unplacedIds.add(item.id);
      continue;
    }

    const free = freeRects[chosen.rectIndex];
    placed.push({
      placementId: item.id,
      cutId: item.cutId,
      label: item.label,
      x: free.x,
      y: free.y,
      footprintAnchoCm: chosen.orientation.w,
      footprintLargoCm: chosen.orientation.h,
      anchoCm: chosen.orientation.anchoCm,
      largoCm: chosen.orientation.largoCm,
      rotated: chosen.orientation.rotated,
    });

    const remaining = freeRects.filter(
      (_, index) => index !== chosen!.rectIndex,
    );
    freeRects = pruneFreeRects([
      ...remaining,
      ...splitFreeRect(free, chosen.orientation.w, chosen.orientation.h),
    ]);
  }

  return { placed, unplacedIds };
}

function mergeSkyline(nodes: SkylineNode[]): SkylineNode[] {
  if (nodes.length === 0) return nodes;

  const sorted = [...nodes].sort((a, b) => a.x - b.x);
  const merged: SkylineNode[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i += 1) {
    const last = merged[merged.length - 1];
    const current = sorted[i];
    if (
      Math.abs(last.y - current.y) < 0.001 &&
      Math.abs(last.x + last.width - current.x) < 0.001
    ) {
      last.width += current.width;
    } else {
      merged.push(current);
    }
  }

  return merged;
}

function findSkylinePosition(
  skyline: SkylineNode[],
  itemW: number,
  itemH: number,
  sheetAnchoCm: number,
  sheetLargoCm: number,
): { x: number; y: number } | null {
  let best: { x: number; y: number; score: number } | null = null;

  for (let i = 0; i < skyline.length; i += 1) {
    const startX = skyline[i].x;
    if (startX + itemW > sheetAnchoCm + 0.001) continue;

    let widthLeft = itemW;
    let segmentIndex = i;
    let baseY = skyline[i].y;
    let maxY = baseY;

    while (widthLeft > 0.001 && segmentIndex < skyline.length) {
      const segment = skyline[segmentIndex];
      if (segment.x >= startX + itemW - widthLeft + 0.001) break;

      maxY = Math.max(maxY, segment.y);
      const segmentEnd = segment.x + segment.width;
      const usedEnd = Math.min(startX + itemW, segmentEnd);
      const usedStart = Math.max(startX, segment.x);
      widthLeft -= Math.max(0, usedEnd - usedStart);
      segmentIndex += 1;
    }

    if (widthLeft > 0.001) continue;
    if (maxY + itemH > sheetLargoCm + 0.001) continue;

    const score = maxY * 10000 + startX;
    if (!best || score < best.score) {
      best = { x: startX, y: maxY, score };
    }
  }

  return best ? { x: best.x, y: best.y } : null;
}

function addSkylineSegment(
  skyline: SkylineNode[],
  x: number,
  y: number,
  width: number,
  height: number,
): SkylineNode[] {
  const endX = x + width;
  const next: SkylineNode[] = [];

  for (const segment of skyline) {
    const segEnd = segment.x + segment.width;
    if (segEnd <= x + 0.001 || segment.x >= endX - 0.001) {
      next.push(segment);
      continue;
    }

    if (segment.x < x - 0.001) {
      next.push({ x: segment.x, y: segment.y, width: x - segment.x });
    }
    if (segEnd > endX + 0.001) {
      next.push({ x: endX, y: segment.y, width: segEnd - endX });
    }
  }

  next.push({ x, y: y + height, width });
  return mergeSkyline(next);
}

function packSkyline(
  sheetAnchoCm: number,
  sheetLargoCm: number,
  items: PackItem[],
  allowRotation: boolean,
): { placed: PlacedCut[]; unplacedIds: Set<string> } {
  let skyline: SkylineNode[] = [{ x: 0, y: 0, width: sheetAnchoCm }];
  const placed: PlacedCut[] = [];
  const unplacedIds = new Set<string>();

  for (const item of items) {
    const orientations = getOrientations(
      item,
      sheetAnchoCm,
      sheetLargoCm,
      allowRotation,
    );
    let chosen: { x: number; y: number; orientation: Orientation } | null =
      null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const orientation of orientations) {
      const pos = findSkylinePosition(
        skyline,
        orientation.w,
        orientation.h,
        sheetAnchoCm,
        sheetLargoCm,
      );
      if (!pos) continue;

      const score = pos.y * 10000 + pos.x;
      if (score >= bestScore) continue;
      bestScore = score;
      chosen = { ...pos, orientation };
    }

    if (!chosen) {
      unplacedIds.add(item.id);
      continue;
    }

    placed.push({
      placementId: item.id,
      cutId: item.cutId,
      label: item.label,
      x: chosen.x,
      y: chosen.y,
      footprintAnchoCm: chosen.orientation.w,
      footprintLargoCm: chosen.orientation.h,
      anchoCm: chosen.orientation.anchoCm,
      largoCm: chosen.orientation.largoCm,
      rotated: chosen.orientation.rotated,
    });

    skyline = addSkylineSegment(
      skyline,
      chosen.x,
      chosen.y,
      chosen.orientation.w,
      chosen.orientation.h,
    );
  }

  return { placed, unplacedIds };
}

function groupItemsByCutId(items: PackItem[]): PackItem[][] {
  const map = new Map<string, PackItem[]>();
  for (const item of items) {
    const list = map.get(item.cutId) ?? [];
    list.push(item);
    map.set(item.cutId, list);
  }

  return Array.from(map.values()).sort(
    (a, b) => b[0].anchoCm * b[0].largoCm - a[0].anchoCm * a[0].largoCm,
  );
}

function isFullWidthOrientation(
  orientation: Orientation,
  sheetAnchoCm: number,
): boolean {
  return Math.abs(orientation.w - sheetAnchoCm) < 0.01;
}

function packGridInRegion(
  originX: number,
  originY: number,
  regionW: number,
  regionH: number,
  groupItems: PackItem[],
  sheetAnchoCm: number,
  sheetLargoCm: number,
  allowRotation: boolean,
): PlacedCut[] | null {
  if (groupItems.length === 0) return [];

  const sample = groupItems[0];
  let bestLayout: PlacedCut[] | null = null;
  let bestWaste = Number.POSITIVE_INFINITY;

  for (const orient of getOrientations(
    sample,
    sheetAnchoCm,
    sheetLargoCm,
    allowRotation,
  )) {
    const cols = Math.floor(regionW / orient.w + 0.0001);
    if (cols <= 0) continue;

    const rows = Math.ceil(groupItems.length / cols);
    const usedH = rows * orient.h;
    if (usedH > regionH + 0.001) continue;

    const placed: PlacedCut[] = groupItems.map((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      return {
        placementId: item.id,
        cutId: item.cutId,
        label: item.label,
        x: originX + col * orient.w,
        y: originY + row * orient.h,
        footprintAnchoCm: orient.w,
        footprintLargoCm: orient.h,
        anchoCm: orient.anchoCm,
        largoCm: orient.largoCm,
        rotated: orient.rotated,
      };
    });

    const waste = regionW * regionH - cols * orient.w * usedH;
    if (waste < bestWaste) {
      bestWaste = waste;
      bestLayout = placed;
    }
  }

  return bestLayout;
}

function packStripAndGrid(
  sheetAnchoCm: number,
  sheetLargoCm: number,
  items: PackItem[],
  allowRotation: boolean,
): { placed: PlacedCut[]; unplacedIds: Set<string> } {
  type Attempt = {
    strip?: { item: PackItem; orientation: Orientation; atTop: boolean };
  };

  const attempts: Attempt[] = [{}];

  for (const item of items) {
    if (!matchesSheetWidth(item, sheetAnchoCm, allowRotation)) continue;

    for (const orientation of getOrientations(
      item,
      sheetAnchoCm,
      sheetLargoCm,
      allowRotation,
    )) {
      if (!isFullWidthOrientation(orientation, sheetAnchoCm)) continue;
      if (orientation.h > sheetLargoCm + 0.001) continue;

      attempts.push({ strip: { item, orientation, atTop: true } });
      attempts.push({ strip: { item, orientation, atTop: false } });
    }
  }

  let best: { placed: PlacedCut[]; unplacedIds: Set<string> } | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const attempt of attempts) {
    const placed: PlacedCut[] = [];
    const usedIds = new Set<string>();

    let regionY = 0;
    let regionH = sheetLargoCm;

    if (attempt.strip) {
      const { item, orientation, atTop } = attempt.strip;
      const y = atTop ? 0 : sheetLargoCm - orientation.h;
      placed.push({
        placementId: item.id,
        cutId: item.cutId,
        label: item.label,
        x: 0,
        y,
        footprintAnchoCm: orientation.w,
        footprintLargoCm: orientation.h,
        anchoCm: orientation.anchoCm,
        largoCm: orientation.largoCm,
        rotated: orientation.rotated,
      });
      usedIds.add(item.id);

      if (atTop) {
        regionY = orientation.h;
        regionH = sheetLargoCm - orientation.h;
      } else {
        regionY = 0;
        regionH = y;
      }
    }

    const remaining = items.filter((item) => !usedIds.has(item.id));
    const groups = groupItemsByCutId(remaining);
    let currentY = regionY;
    let failed = false;

    for (const group of groups) {
      const grid = packGridInRegion(
        0,
        currentY,
        sheetAnchoCm,
        sheetLargoCm - currentY,
        group,
        sheetAnchoCm,
        sheetLargoCm,
        allowRotation,
      );

      if (!grid) {
        failed = true;
        break;
      }

      placed.push(...grid);
      grid.forEach((piece) => usedIds.add(piece.placementId));
      currentY = Math.max(
        ...grid.map((piece) => piece.y + piece.footprintLargoCm),
      );
    }

    if (failed || usedIds.size !== items.length) continue;

    const unplacedIds = new Set<string>();
    const score = scorePack(placed, 0, sheetAnchoCm * sheetLargoCm);
    if (score < bestScore) {
      bestScore = score;
      best = { placed, unplacedIds };
    }
  }

  if (best) return best;

  return {
    placed: [],
    unplacedIds: new Set(items.map((item) => item.id)),
  };
}

function matchesSheetWidth(
  item: PackItem,
  sheetAnchoCm: number,
  allowRotation: boolean,
): boolean {
  const tolerance = 0.5;
  if (Math.abs(item.anchoCm - sheetAnchoCm) <= tolerance) return true;
  if (allowRotation && Math.abs(item.largoCm - sheetAnchoCm) <= tolerance) {
    return true;
  }
  return false;
}

type SortStrategy = (
  items: PackItem[],
  sheetAnchoCm: number,
  sheetLargoCm: number,
) => PackItem[];

const SORT_STRATEGIES: SortStrategy[] = [
  (items, sheetAnchoCm, sheetLargoCm) =>
    [...items].sort(
      (a, b) =>
        itemArea(b, sheetAnchoCm, sheetLargoCm) -
        itemArea(a, sheetAnchoCm, sheetLargoCm),
    ),
  (items, sheetAnchoCm, sheetLargoCm) =>
    [...items].sort(
      (a, b) =>
        itemMaxSide(b, sheetAnchoCm, sheetLargoCm) -
        itemMaxSide(a, sheetAnchoCm, sheetLargoCm),
    ),
  (items, sheetAnchoCm, sheetLargoCm) =>
    [...items].sort(
      (a, b) =>
        itemFootprintWidth(b, sheetAnchoCm, sheetLargoCm) -
        itemFootprintWidth(a, sheetAnchoCm, sheetLargoCm),
    ),
  (items, sheetAnchoCm, sheetLargoCm) =>
    [...items].sort(
      (a, b) =>
        itemFootprintHeight(b, sheetAnchoCm, sheetLargoCm) -
        itemFootprintHeight(a, sheetAnchoCm, sheetLargoCm),
    ),
  (items, sheetAnchoCm, sheetLargoCm) => {
    const fullWidth = items.filter((item) =>
      matchesSheetWidth(item, sheetAnchoCm, true),
    );
    const rest = items.filter(
      (item) => !matchesSheetWidth(item, sheetAnchoCm, true),
    );
    const byArea = (a: PackItem, b: PackItem) =>
      itemArea(b, sheetAnchoCm, sheetLargoCm) -
      itemArea(a, sheetAnchoCm, sheetLargoCm);
    return [...fullWidth.sort(byArea), ...rest.sort(byArea)];
  },
  (items, sheetAnchoCm, sheetLargoCm) =>
    [...items].sort(
      (a, b) =>
        itemArea(a, sheetAnchoCm, sheetLargoCm) -
        itemArea(b, sheetAnchoCm, sheetLargoCm),
    ),
];

function summarizeUnplaced(
  items: PackItem[],
  unplacedIds: Set<string>,
  cuts: CutRequest[],
): CutRequest[] {
  if (unplacedIds.size === 0) return [];

  const countByCutId = new Map<string, number>();
  for (const item of items) {
    if (!unplacedIds.has(item.id)) continue;
    countByCutId.set(item.cutId, (countByCutId.get(item.cutId) ?? 0) + 1);
  }

  return cuts
    .map((cut) => {
      const missing = countByCutId.get(cut.id) ?? 0;
      if (missing <= 0) return null;
      return { ...cut, quantity: missing };
    })
    .filter((cut): cut is CutRequest => cut !== null);
}

function scorePack(
  placed: PlacedCut[],
  unplacedCount: number,
  sheetAreaCm2: number,
): number {
  if (unplacedCount > 0) return unplacedCount * 1_000_000;

  const cutsAreaCm2 = placed.reduce(
    (sum, cut) => sum + superficieCm2FromDimensions(cut.anchoCm, cut.largoCm),
    0,
  );

  return sheetAreaCm2 - cutsAreaCm2;
}

function runBestPacking(
  sheetAnchoCm: number,
  sheetLargoCm: number,
  items: PackItem[],
  allowRotation: boolean,
): { placed: PlacedCut[]; unplacedIds: Set<string> } {
  const sheetAreaCm2 = superficieCm2FromDimensions(sheetAnchoCm, sheetLargoCm);
  let best: { placed: PlacedCut[]; unplacedIds: Set<string> } | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  const packers = [packStripAndGrid, packMaxRects, packSkyline] as const;

  for (const pack of packers) {
    for (const sort of SORT_STRATEGIES) {
      const sorted = sort(items, sheetAnchoCm, sheetLargoCm);
      const result = pack(sheetAnchoCm, sheetLargoCm, sorted, allowRotation);
      const score = scorePack(
        result.placed,
        result.unplacedIds.size,
        sheetAreaCm2,
      );

      if (score < bestScore) {
        bestScore = score;
        best = result;
      }
    }
  }

  return (
    best ?? {
      placed: [],
      unplacedIds: new Set(items.map((item) => item.id)),
    }
  );
}

export function optimizeCutLayout(input: {
  sheetAnchoCm: number;
  sheetLargoCm: number;
  cuts: CutRequest[];
  allowRotation?: boolean;
}): PackResult | null {
  const { sheetAnchoCm, sheetLargoCm, cuts } = input;
  const allowRotation = input.allowRotation ?? true;

  if (
    !Number.isFinite(sheetAnchoCm) ||
    sheetAnchoCm <= 0 ||
    !Number.isFinite(sheetLargoCm) ||
    sheetLargoCm <= 0 ||
    cuts.length === 0
  ) {
    return null;
  }

  const items = expandCutRequests(cuts);
  const { placed, unplacedIds } = runBestPacking(
    sheetAnchoCm,
    sheetLargoCm,
    items,
    allowRotation,
  );

  const sheetAreaCm2 = superficieCm2FromDimensions(sheetAnchoCm, sheetLargoCm);
  const usedFootprintCm2 = placed.reduce(
    (sum, cut) => sum + cut.footprintAnchoCm * cut.footprintLargoCm,
    0,
  );
  const cutsAreaCm2 = placed.reduce(
    (sum, cut) => sum + superficieCm2FromDimensions(cut.anchoCm, cut.largoCm),
    0,
  );
  const wasteCm2 = Math.max(0, sheetAreaCm2 - cutsAreaCm2);
  const efficiencyPercent =
    sheetAreaCm2 > 0 ? (cutsAreaCm2 / sheetAreaCm2) * 100 : 0;

  return {
    placed,
    unplaced: summarizeUnplaced(items, unplacedIds, cuts),
    sheetAnchoCm,
    sheetLargoCm,
    sheetAreaCm2,
    usedFootprintCm2,
    cutsAreaCm2,
    wasteCm2,
    efficiencyPercent,
    kerfCm: KERF_CM_PER_SIDE,
  };
}
