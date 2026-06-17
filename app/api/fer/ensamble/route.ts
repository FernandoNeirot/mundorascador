import { TENANTS } from "@/lib/tenant/config";
import { createEnsambleRoutes } from "@/lib/tenant/routes/ensamble";

const routes = createEnsambleRoutes(TENANTS.fer);

export const GET = routes.GET;
export const POST = routes.POST;
