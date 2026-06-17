import { TENANTS } from "@/lib/tenant/config";
import { createCotizadorRoutes } from "@/lib/tenant/routes/cotizador";

const routes = createCotizadorRoutes(TENANTS.fer);

export const GET = routes.GET;
export const POST = routes.POST;
