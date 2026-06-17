import Optimizador from "@/components/admin/Optimizador";
import { getSessionFromCookies } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminFerOptimizadorPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  return <Optimizador />;
}
