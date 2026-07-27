"use client";

import { useCallback, useEffect } from "react";
import { Bell, ArrowDownLeft, ArrowUpRight, RefreshCw, X, Info, AlertTriangle, Settings } from "lucide-react";
import { useFreighter } from "@/contexts/FreighterContext";
import { useOnChainNotifications, type NotificationEntry } from "@/hooks/useOnChainNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useNotifications, type AppNotification, type NotificationCategory } from "@/contexts/NotificationContext";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { formatRelativeTime } from "@/lib/utils";
import type { TransactionKind } from "@/types/transactions";

const KIND_ICON: Record<TransactionKind, typeof Bell> = {
  DEPOSIT: ArrowDownLeft,
  WITHDRAW: ArrowUpRight,
  REBALANCE: RefreshCw,
};

const CATEGORY_ICON: Record<NotificationCategory, typeof Bell> = {
  transaction: RefreshCw,
  risk: AlertTriangle,
  system: Settings,
  info: Info,
};

const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  transaction: "Transactions",
  risk: "Risk Alerts",
  system: "System",
  info: "Info",
};

function iconForNotification(entry: AppNotification) {
  return CATEGORY_ICON[entry.category] ?? Bell;
}

function NotificationRow({
  entry,
  onMarkRead,
  onDismiss,
}: {
  entry: AppNotification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const Icon = iconForNotification(entry);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onMarkRead(entry.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onMarkRead(entry.id);
      }}
      className={`group flex items-start gap-2.5 px-3 py-2.5 border-b border-border last:border-0 cursor-pointer ${
        entry.read ? "" : "bg-primary/5"
      }`}
    >
      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-tight">{entry.title}</p>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{entry.message}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          {formatRelativeTime(entry.timestampISO)}
        </p>
      </div>
      {!entry.read && (
        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" aria-hidden="true" />
      )}
      <button
        type="button"
        aria-label={`Dismiss notification: ${entry.title}`}
        onClick={(e) => {
          e.stopPropagation();
          onDismiss(entry.id);
        }}
        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-0.5 rounded hover:bg-muted shrink-0 transition-opacity"
      >
        <X className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  );
}

export function NotificationCenter() {
  const { address } = useFreighter();
  const { showNotification } = usePushNotifications();
  const { notifications, unreadCount, addNotification, markRead, markAllRead, dismiss } =
    useNotifications();

  const onNewEntries = useCallback(
    (entries: NotificationEntry[]) => {
      // Cap it — if a bunch of events land in one poll, showing that many
      // OS notifications at once is more spam than signal.
      entries.slice(0, 3).forEach((entry) => {
        void showNotification(entry.title, entry.message);
      });
    },
    [showNotification]
  );

  const { notifications: onChainNotifications } = useOnChainNotifications({
    account: address,
    onNewEntries,
  });

  // Feed on-chain events into the shared, categorized notification store.
  // addNotification is idempotent by id, so re-running this on every poll
  // tick is cheap and safe.
  useEffect(() => {
    onChainNotifications.forEach((entry) => {
      addNotification({
        id: entry.id,
        category: "transaction",
        title: entry.title,
        message: entry.message,
        timestampISO: entry.timestampISO,
      });
    });
  }, [onChainNotifications, addNotification]);

  const categories = Array.from(new Set(notifications.map((n) => n.category)));

  return (
    <Popover>
      <PopoverTrigger
        className="relative p-2 hover:bg-muted rounded-lg transition-colors"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center"
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent className="max-h-[400px] overflow-hidden flex flex-col">
        <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
          <p className="text-sm font-bold">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 px-3">
              No notifications yet
            </p>
          ) : (
            categories.map((category) => (
              <div key={category}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                  {CATEGORY_LABEL[category]}
                </p>
                {notifications
                  .filter((n) => n.category === category)
                  .map((entry) => (
                    <NotificationRow
                      key={entry.id}
                      entry={entry}
                      onMarkRead={markRead}
                      onDismiss={dismiss}
                    />
                  ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
