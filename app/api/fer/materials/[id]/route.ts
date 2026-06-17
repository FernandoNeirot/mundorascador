import { TENANTS } from "@/lib/tenant/config";
import { createMaterialsByIdRoutes } from "@/lib/tenant/routes/materials";

const routes = createMaterialsByIdRoutes(TENANTS.fer);

export const PATCH = routes.PATCH;
