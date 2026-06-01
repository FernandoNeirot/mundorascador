import Cotizador from "@/components/admin/Cotizador";
import { canWriteStock } from "@/lib/auth/permissions";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getCotizaciones } from "@/lib/cotizador/quote-storage";
import { getStockEntries } from "@/lib/materials/stock-storage";
import { redirect } from "next/navigation";

export default async function AdminCotizadorPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const [entries, cotizaciones] = await Promise.all([
    getStockEntries(),
    getCotizaciones(),
  ]);

  return (
    <Cotizador
      initialEntries={entries}
      initialCotizaciones={cotizaciones}
      canWrite={canWriteStock(session)}
    />
  );
}
