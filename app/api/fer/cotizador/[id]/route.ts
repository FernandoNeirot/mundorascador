import { TENANTS } from "@/lib/tenant/config";
import { createCotizadorByIdRoutes } from "@/lib/tenant/routes/cotizador";

const routes = createCotizadorByIdRoutes(TENANTS.fer);

export const GET = routes.GET;
export const PATCH = routes.PATCH;
export const DELETE = routes.DELETE;
