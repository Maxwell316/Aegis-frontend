"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * Small top-of-page banner shown while the browser is offline. The
 * next-pwa-generated service worker serves the cached app shell and any
 * previously-fetched data in this state, so we surface a staleness notice
 * rather than a hard error.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-yellow-500/10 px-4 py-1.5 text-xs font-medium text-yellow-700 dark:text-yellow-400"
    >
      <WifiOff className="h-3.5 w-3.5" />
      <span>You&apos;re offline — showing cached data, which may be stale.</span>
    </div>
  );
}
