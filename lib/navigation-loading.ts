export const NAVIGATION_START_EVENT = "app-navigation-start";

/** Muestra el loader de página hasta que termine la navegación (p. ej. router.push). */
export function startPageNavigation(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NAVIGATION_START_EVENT));
}
