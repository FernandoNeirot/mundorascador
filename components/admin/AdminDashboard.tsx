import Link from "next/link";

const actions = [
  {
    href: "/admin/stock",
    title: "Ver stock",
    description: "Consultá el inventario y cargá materiales.",
  },
  {
    href: "/admin/cotizador",
    title: "Cotizador",
    description: "Armá presupuestos con los productos del stock.",
  },
] as const;

export default function AdminDashboard() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header>
        <p className="text-sm font-medium uppercase tracking-wider text-amber-700 dark:text-amber-400">
          Administración
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Panel principal
        </h1>
        <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
          Elegí una sección para continuar.
        </p>
      </header>

      <div className="grid gap-5 sm:grid-cols-2">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-amber-600/40 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-amber-500/40"
          >
            <h2 className="text-lg font-medium text-zinc-900 group-hover:text-amber-800 dark:text-zinc-50 dark:group-hover:text-amber-400">
              {action.title}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {action.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
