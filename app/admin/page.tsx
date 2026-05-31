import StockManager from "@/components/admin/StockManager";
import { canWriteStock } from "@/lib/auth/permissions";
import { getSessionFromCookies } from "@/lib/auth/session";
import { getStockEntries } from "@/lib/materials/stock-storage";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  const entries = await getStockEntries();

  return (
    <StockManager
      initialEntries={entries}
      canWrite={canWriteStock(session.role)}
    />
  );
}
