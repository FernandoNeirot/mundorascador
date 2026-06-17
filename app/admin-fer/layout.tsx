import AdminHeader from "@/components/admin/AdminHeader";
import { getSessionFromCookies } from "@/lib/auth/session";
import { AdminTenantProvider } from "@/lib/tenant/context";
import { TENANTS } from "@/lib/tenant/config";
import { redirect } from "next/navigation";

export default async function AdminFerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  return (
    <AdminTenantProvider tenant={TENANTS.fer}>
      <div className="min-h-full flex-1 bg-zinc-50 dark:bg-zinc-950">
        <AdminHeader user={session} />
        {children}
      </div>
    </AdminTenantProvider>
  );
}
