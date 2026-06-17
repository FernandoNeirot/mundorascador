import { TENANTS } from "@/lib/tenant/config";
import { createMaterialsRoutes } from "@/lib/tenant/routes/materials";

const routes = createMaterialsRoutes(TENANTS.fer);

export const GET = routes.GET;
export const POST = routes.POST;
