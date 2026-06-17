import { TENANTS } from "@/lib/tenant/config";
import { createEnsambleByIdRoutes } from "@/lib/tenant/routes/ensamble";

const routes = createEnsambleByIdRoutes(TENANTS.fer);

export const GET = routes.GET;
export const PATCH = routes.PATCH;
export const DELETE = routes.DELETE;
