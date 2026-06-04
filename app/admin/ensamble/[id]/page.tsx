import EnsambleRascador from "@/components/admin/EnsambleRascador";
import { canWriteEnsamble } from "@/lib/auth/permissions";
import { canEditEnsamble } from "@/lib/ensamble/permissions";
import { getSessionFromCookies } from "@/lib/auth/session";
import { normalizeConfigPisosOrder } from "@/lib/ensamble/cat-scratcher";
import { getEnsambleById } from "@/lib/ensamble/ensamble-storage";
import { getStockEntries } from "@/lib/materials/stock-storage";
import { redirect, notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEnsambleDetailPage({ params }: PageProps) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const { id } = await params;
  const [ensamble, stockEntries] = await Promise.all([
    getEnsambleById(id),
    getStockEntries(),
  ]);
  if (!ensamble) notFound();

  const canEdit = canEditEnsamble(session, ensamble);

  return (
    <EnsambleRascador
      mode="edit"
      ensambleId={ensamble.id}
      initialConfig={normalizeConfigPisosOrder(ensamble.config)}
      initialDescripcion={ensamble.descripcion}
      initialMateriales={ensamble.materiales}
      initialCotizacionPrefs={ensamble.cotizacionPrefs}
      stockEntries={stockEntries}
      canEdit={canEdit}
      canWrite={canWriteEnsamble(session)}
      createdBy={ensamble.createdBy}
    />
  );
}
