export default function PageLoader() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-zinc-50/90 backdrop-blur-sm dark:bg-zinc-950/90"
      role="status"
      aria-live="polite"
      aria-label="Cargando página"
    >
      <div
        className="h-11 w-11 animate-spin rounded-full border-4 border-amber-200 border-t-amber-700 dark:border-amber-900 dark:border-t-amber-400"
        aria-hidden
      />
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        Cargando…
      </p>
    </div>
  );
}
