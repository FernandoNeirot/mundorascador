export type MaterialType =
  | "telas"
  | "guata"
  | "maderas"
  | "cano_pvc"
  | "herramientas";

export type FabricLikeType = "telas" | "guata";

export type WoodType = "fibro_facil" | "pino";

export type BuyerType = "chino" | "fernando" | "flavio";

type BaseStockEntry = {
  id: string;
  updatedAt: string;
  price: number;
  quantity: number;
  compradoPor: BuyerType;
};

export type TelaStockEntry = BaseStockEntry & {
  type: "telas";
  marca: string;
  anchoCm: number;
  largoCm: number;
  color: string;
};

export type GuataStockEntry = BaseStockEntry & {
  type: "guata";
  marca: string;
  anchoCm: number;
  largoCm: number;
  color: string;
};

export type FabricLikeStockEntry = TelaStockEntry | GuataStockEntry;

export type MaderaStockEntry = BaseStockEntry & {
  type: "maderas";
  anchoCm: number;
  largoCm: number;
  tipoMadera: WoodType;
};

export type CanoPvcStockEntry = BaseStockEntry & {
  type: "cano_pvc";
  anchoMm: number;
  largoCm: number;
};

export type HerramientaStockEntry = BaseStockEntry & {
  type: "herramientas";
  descripcion: string;
};

export type StockEntry =
  | TelaStockEntry
  | GuataStockEntry
  | MaderaStockEntry
  | CanoPvcStockEntry
  | HerramientaStockEntry;

type CreateStockBase = {
  price: number;
  quantity: number;
  compradoPor: BuyerType;
};

export type CreateTelaInput = CreateStockBase & {
  type: "telas";
  marca: string;
  anchoCm: number;
  largoCm: number;
  color: string;
};

export type CreateGuataInput = CreateStockBase & {
  type: "guata";
  marca: string;
  anchoCm: number;
  largoCm: number;
  color: string;
};

export type CreateFabricLikeInput = CreateTelaInput | CreateGuataInput;

export type CreateMaderaInput = CreateStockBase & {
  type: "maderas";
  anchoCm: number;
  largoCm: number;
  tipoMadera: WoodType;
};

export type CreateCanoPvcInput = CreateStockBase & {
  type: "cano_pvc";
  anchoMm: number;
  largoCm: number;
};

export type CreateHerramientaInput = CreateStockBase & {
  type: "herramientas";
  descripcion: string;
};

export type CreateStockEntryInput =
  | CreateTelaInput
  | CreateGuataInput
  | CreateMaderaInput
  | CreateCanoPvcInput
  | CreateHerramientaInput;
