"use client";

import { createContext, useContext } from "react";
import { adminPath, apiPath, TENANTS, type AdminTenant, type TenantId } from "./config";

const AdminTenantContext = createContext<AdminTenant>(TENANTS.default);

export function AdminTenantProvider({
  tenant,
  children,
}: {
  tenant: AdminTenant;
  children: React.ReactNode;
}) {
  return (
    <AdminTenantContext.Provider value={tenant}>
      {children}
    </AdminTenantContext.Provider>
  );
}

export function useAdminTenant(): AdminTenant {
  return useContext(AdminTenantContext);
}

export function getTenantById(id: TenantId): AdminTenant {
  return TENANTS[id];
}

export function useTenantPaths() {
  const tenant = useAdminTenant();
  return {
    tenant,
    basePath: tenant.basePath,
    materialsApi: apiPath(tenant.apiPrefix, "materials"),
    cotizadorApi: apiPath(tenant.apiPrefix, "cotizador"),
    ensambleApi: apiPath(tenant.apiPrefix, "ensamble"),
    path: (...segments: string[]) => adminPath(tenant.basePath, ...segments),
  };
}
