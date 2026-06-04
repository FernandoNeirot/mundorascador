import type { RascadorEnsambleConfig } from "./cat-scratcher";

export type EnsambleTipo = "rascador-gatos";

export type Ensamble = {
  id: string;
  tipo: EnsambleTipo;
  config: RascadorEnsambleConfig;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
};

export type CreateEnsambleInput = {
  tipo?: EnsambleTipo;
  config?: RascadorEnsambleConfig;
};

export type UpdateEnsambleInput = {
  config: RascadorEnsambleConfig;
};
