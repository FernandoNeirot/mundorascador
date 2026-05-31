export type MaterialType =
  | "telas"
  | "guata"
  | "hilo"
  | "maderas"
  | "cano_pvc"
  | "herramientas";

export type FabricLikeType = "telas" | "guata";

export type MeterBasedType = "telas" | "guata" | "hilo" | "cano_pvc";

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
  descripcion: string;
  anchoCm: number;
  largoCm: number;
  color: string;
};

export type GuataStockEntry = BaseStockEntry & {
  type: "guata";
  descripcion: string;
  anchoCm: number;
  largoCm: number;
  color: string;
};

export type HiloStockEntry = BaseStockEntry & {
  type: "hilo";
  descripcion: string;
  largoCm: number;
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
  | HiloStockEntry
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
  descripcion: string;
  anchoCm: number;
  largoCm: number;
  color: string;
};

export type CreateGuataInput = CreateStockBase & {
  type: "guata";
  descripcion: string;
  anchoCm: number;
  largoCm: number;
  color: string;
};

export type CreateHiloInput = CreateStockBase & {
  type: "hilo";
  descripcion: string;
  largoCm: number;
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
  | CreateHiloInput
  | CreateMaderaInput
  | CreateCanoPvcInput
  | CreateHerramientaInput;
