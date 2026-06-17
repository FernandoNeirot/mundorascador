export type TenantId = "default" | "fer";

export type AdminTenant = {
  id: TenantId;
  basePath: string;
  apiPrefix: string;
  title: string;
  collections: {
    stock: string;
    cotizador: string;
    ensambles: string;
  };
};

export const TENANTS: Record<TenantId, AdminTenant> = {
  default: {
    id: "default",
    basePath: "/admin",
    apiPrefix: "/api",
    title: "Taller carpintería",
    collections: {
      stock: "taller-stock",
      cotizador: "taller-cotizador",
      ensambles: "taller-ensambles",
    },
  },
  fer: {
    id: "fer",
    basePath: "/admin-fer",
    apiPrefix: "/api/fer",
    title: "Taller Fer",
    collections: {
      stock: "taller-fer-stock",
      cotizador: "taller-fer-cotizador",
      ensambles: "taller-fer-ensambles",
    },
  },
};

export function adminPath(basePath: string, ...segments: string[]): string {
  const path = [basePath, ...segments].filter(Boolean).join("/");
  return path.replace(/\/{2,}/g, "/");
}

export function apiPath(apiPrefix: string, ...segments: string[]): string {
  const path = [apiPrefix, ...segments].filter(Boolean).join("/");
  return path.replace(/\/{2,}/g, "/");
}
