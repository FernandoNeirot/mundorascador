import EnsambleRascador from "@/components/admin/EnsambleRascador";
import { canWriteEnsamble } from "@/lib/auth/permissions";
import { getSessionFromCookies } from "@/lib/auth/session";
import { EMPTY_RASCADOR_CONFIG } from "@/lib/ensamble/cat-scratcher";
import { redirect } from "next/navigation";

export default async function AdminEnsambleNuevoPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  if (!canWriteEnsamble(session)) {
    redirect("/admin/ensamble");
  }

  return (
    <EnsambleRascador
      mode="create"
      initialConfig={EMPTY_RASCADOR_CONFIG}
      canEdit
      canWrite
    />
  );
}
