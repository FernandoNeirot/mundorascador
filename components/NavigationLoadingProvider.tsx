"use client";

import PageLoader from "@/components/PageLoader";
import { NAVIGATION_START_EVENT } from "@/lib/navigation-loading";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";

const LOADER_TIMEOUT_MS = 30_000;

function isInternalNavigationClick(event: MouseEvent): boolean {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return false;
  }

  const anchor = (event.target as Element | null)?.closest("a");
  if (!anchor) return false;

  const href = anchor.getAttribute("href");
  if (
    !href ||
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return false;
  }

  if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
    return false;
  }

  try {
    const url = new URL(href, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

function NavigationLoadingListener({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const onStart = () => setLoading(true);

    const onClick = (event: MouseEvent) => {
      if (!isInternalNavigationClick(event)) return;

      const anchor = (event.target as Element).closest("a");
      const href = anchor?.getAttribute("href");
      if (!href) return;

      try {
        const url = new URL(href, window.location.href);
        const currentSearch = searchParams.toString();
        const nextSearch = url.search.replace(/^\?/, "");
        if (url.pathname === pathname && nextSearch === currentSearch) {
          return;
        }
        setLoading(true);
      } catch {
        return;
      }
    };

    window.addEventListener(NAVIGATION_START_EVENT, onStart);
    document.addEventListener("click", onClick, true);

    return () => {
      window.removeEventListener(NAVIGATION_START_EVENT, onStart);
      document.removeEventListener("click", onClick, true);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!loading) return;

    const timeout = window.setTimeout(() => {
      setLoading(false);
    }, LOADER_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [loading]);

  return (
    <>
      {children}
      {loading && <PageLoader />}
    </>
  );
}

export default function NavigationLoadingProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <NavigationLoadingListener>{children}</NavigationLoadingListener>
    </Suspense>
  );
}
