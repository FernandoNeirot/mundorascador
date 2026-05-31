import StockManager from "@/components/admin/StockManager";
import { getStockEntries } from "@/lib/materials/stock-storage";

export default async function AdminPage() {
  const entries = await getStockEntries();

  return (
    <main className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
      <StockManager initialEntries={entries} />
    </main>
  );
}
