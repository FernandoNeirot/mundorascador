import { createQuoteStorage } from "@/lib/cotizador/quote-storage";
import { createEnsambleStorage } from "@/lib/ensamble/ensamble-storage";
import { createStockStorage } from "@/lib/materials/stock-storage";
import { TENANTS, type TenantId } from "./config";

export type TenantStorage = {
  stock: ReturnType<typeof createStockStorage>;
  cotizador: ReturnType<typeof createQuoteStorage>;
  ensambles: ReturnType<typeof createEnsambleStorage>;
};

const cache = new Map<TenantId, TenantStorage>();

export function getTenantStorage(tenantId: TenantId): TenantStorage {
  const cached = cache.get(tenantId);
  if (cached) return cached;

  const tenant = TENANTS[tenantId];
  const storage: TenantStorage = {
    stock: createStockStorage(tenant.collections.stock),
    cotizador: createQuoteStorage(tenant.collections.cotizador),
    ensambles: createEnsambleStorage(tenant.collections.ensambles),
  };
  cache.set(tenantId, storage);
  return storage;
}
