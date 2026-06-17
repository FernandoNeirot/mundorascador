import AdminDashboard from "@/components/admin/AdminDashboard";
import { getSessionFromCookies } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function AdminFerPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  return <AdminDashboard />;
}
