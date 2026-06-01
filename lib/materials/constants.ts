import type { BuyerType, MaterialType, WoodType } from "./types";

export const MATERIAL_CONFIG: Record<MaterialType, { label: string }> = {
  telas: { label: "Telas" },
  guata: { label: "Guata" },
  hilo: { label: "Hilo" },
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
  "hilo",
  "maderas",
  "cano_pvc",
];

export const ALL_STOCK_TYPES = Object.keys(
  MATERIAL_CONFIG,
) as MaterialType[];

/** Tipos seleccionables al editar un registro (incluye producto genérico). */
export const EDITABLE_MATERIAL_TYPES = ALL_STOCK_TYPES;

export const WOOD_TYPES = Object.keys(WOOD_TYPE_CONFIG) as WoodType[];
export const BUYER_TYPES = Object.keys(BUYER_CONFIG) as BuyerType[];
export const isFabricLikeType = (
  type: MaterialType,
): type is "telas" | "guata" => type === "telas" || type === "guata";

export const isMeterBasedType = (
  type: MaterialType,
): type is "telas" | "guata" | "hilo" =>
  type === "telas" || type === "guata" || type === "hilo";

export const isCanoPvcType = (
  type: MaterialType,
): type is "cano_pvc" => type === "cano_pvc";

export const isFabricLikeEntry = (
  entry: { type: MaterialType },
): entry is {
  type: "telas" | "guata";
  descripcion: string;
  anchoCm: number;
  largoCm: number;
  color: string;
} => isFabricLikeType(entry.type);

export const isMeterBasedEntry = (
  entry: { type: MaterialType },
): entry is
  | {
      type: "telas" | "guata";
      descripcion: string;
      anchoCm: number;
      largoCm: number;
      color: string;
    }
  | { type: "hilo"; descripcion: string; largoCm: number } =>
  isMeterBasedType(entry.type);
