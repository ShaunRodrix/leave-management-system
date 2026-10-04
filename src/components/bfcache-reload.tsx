"use client";

import { useEffect } from "react";

/**
 * Renders nothing. When the browser restores this page from the
 * back-forward cache (Back/Forward button without a server round-trip),
 * force a real reload so the proxy re-evaluates the session cookie.
 * Without this, a logged-out user pressing Back could see a frozen,
 * cached copy of a protected page.
 */
export function BfcacheReload() {
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) window.location.reload();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return null;
}
