import Cotizador from "@/components/admin/Cotizador";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getStockEntries } from "@/lib/materials/stock-storage";
import { redirect } from "next/navigation";

export default async function AdminCotizadorPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const entries = await getStockEntries();

  return <Cotizador initialEntries={entries} />;
}
