import StockManager from "@/components/admin/StockManager";
import { canWriteStock } from "@/lib/auth/permissions";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getTenantStorage } from "@/lib/tenant/storage";
import { redirect } from "next/navigation";

export default async function AdminFerStockPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const entries = await getTenantStorage("fer").stock.getStockEntries();

  return (
    <StockManager
      initialEntries={entries}
      canWrite={canWriteStock(session)}
    />
  );
}
