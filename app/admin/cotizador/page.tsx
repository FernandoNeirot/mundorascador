import Cotizador from "@/components/admin/Cotizador";
import { canWriteCotizador } from "@/lib/auth/permissions";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getCotizaciones } from "@/lib/cotizador/quote-storage";
import { getEnsambles } from "@/lib/ensamble/ensamble-storage";
import { getStockEntries } from "@/lib/materials/stock-storage";
import { redirect } from "next/navigation";

export default async function AdminCotizadorPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const [entries, cotizaciones, ensambles] = await Promise.all([
    getStockEntries(),
    getCotizaciones(),
    getEnsambles(),
  ]);

  return (
    <Cotizador
      initialEntries={entries}
      initialCotizaciones={cotizaciones}
      initialEnsambles={ensambles}
      canWrite={canWriteCotizador(session)}
      currentUsername={session.username}
    />
  );
}
