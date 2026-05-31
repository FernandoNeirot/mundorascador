import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950">
      <Suspense fallback={<div className="text-sm text-zinc-500">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
