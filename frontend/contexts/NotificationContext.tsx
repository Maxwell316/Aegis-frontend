"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

const STORAGE_KEY = "aegis_notifications";
const MAX_STORED = 100;

export type NotificationCategory = "transaction" | "risk" | "system" | "info";

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  message: string;
  timestampISO: string;
  read: boolean;
}

export type NewNotificationInput = Omit<AppNotification, "timestampISO" | "read"> & {
  timestampISO?: string;
};

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  /** Adds a notification. Idempotent by `id` — re-adding an existing id is a no-op. */
  addNotification: (input: NewNotificationInput) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

function readStored(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function writeStored(list: AppNotification[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage full or unavailable — notifications still work for this session
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => readStored());

  useEffect(() => {
    writeStored(notifications);
  }, [notifications]);

  const addNotification = useCallback((input: NewNotificationInput) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === input.id)) return prev;
      const next: AppNotification = {
        id: input.id,
        category: input.category,
        title: input.title,
        message: input.message,
        timestampISO: input.timestampISO ?? new Date().toISOString(),
        read: false,
      };
      return [next, ...prev].slice(0, MAX_STORED);
    });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) =>
      prev.some((n) => !n.read) ? prev.map((n) => ({ ...n, read: true })) : prev,
    );
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clear = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.reduce((count, n) => count + (n.read ? 0 : 1), 0);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markRead, markAllRead, dismiss, clear }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationProvider");
  return ctx;
}
