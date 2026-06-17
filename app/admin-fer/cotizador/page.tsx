import Cotizador from "@/components/admin/Cotizador";
import { canWriteCotizador } from "@/lib/auth/permissions";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getTenantStorage } from "@/lib/tenant/storage";
import { redirect } from "next/navigation";

export default async function AdminFerCotizadorPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const storage = getTenantStorage("fer");
  const [entries, cotizaciones, ensambles] = await Promise.all([
    storage.stock.getStockEntries(),
    storage.cotizador.getCotizaciones(),
    storage.ensambles.getEnsambles(),
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
