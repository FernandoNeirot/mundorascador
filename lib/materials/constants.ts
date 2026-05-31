import type { BuyerType, MaterialType, WoodType } from "./types";

export const MATERIAL_CONFIG: Record<MaterialType, { label: string }> = {
  telas: { label: "Telas" },
  guata: { label: "Guata" },
  maderas: { label: "Maderas" },
  cano_pvc: { label: "Caño PVC" },
  herramientas: { label: "Producto genérico" },
};

export const WOOD_TYPE_CONFIG: Record<WoodType, { label: string }> = {
  fibro_facil: { label: "Fibro fácil" },
  pino: { label: "Pino" },
};

export const BUYER_CONFIG: Record<BuyerType, { label: string }> = {
  chino: { label: "Chino" },
  fernando: { label: "Fernando" },
  flavio: { label: "Flavio" },
};

export const MATERIAL_TYPES: MaterialType[] = [
  "telas",
  "guata",
  "maderas",
  "cano_pvc",
];

export const ALL_STOCK_TYPES = Object.keys(
  MATERIAL_CONFIG,
) as MaterialType[];

export const WOOD_TYPES = Object.keys(WOOD_TYPE_CONFIG) as WoodType[];
export const BUYER_TYPES = Object.keys(BUYER_CONFIG) as BuyerType[];

export const isFabricLikeType = (
  type: MaterialType,
): type is "telas" | "guata" => type === "telas" || type === "guata";

export const isFabricLikeEntry = (
  entry: { type: MaterialType },
): entry is { type: "telas" | "guata"; marca: string; anchoCm: number; largoCm: number; color: string } =>
  isFabricLikeType(entry.type);
