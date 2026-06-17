import EnsambleRascador from "@/components/admin/EnsambleRascador";
import { canWriteEnsamble } from "@/lib/auth/permissions";
import { getSessionFromCookies } from "@/lib/auth/session";
import { EMPTY_RASCADOR_CONFIG } from "@/lib/ensamble/cat-scratcher";
import { getTenantStorage } from "@/lib/tenant/storage";
import { redirect } from "next/navigation";

export default async function AdminFerEnsambleNuevoPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  if (!canWriteEnsamble(session)) {
    redirect("/admin-fer/ensamble");
  }

  const stockEntries = await getTenantStorage("fer").stock.getStockEntries();

  return (
    <EnsambleRascador
      mode="create"
      initialConfig={EMPTY_RASCADOR_CONFIG}
      stockEntries={stockEntries}
      canEdit
      canWrite
    />
  );
}
