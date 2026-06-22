"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNotificationReadState } from "@autopainel/shared/hooks/use-notification-read-state";
import {
  isBillingAlertDueSoon,
  mapBillingHistoryNotification,
  mapDealershipStatusNotification,
} from "@autopainel/shared/lib/notifications/platform-billing-notification-items";
import {
  NotificationBellTrigger,
  NotificationCenterSheet,
  type NotificationCenterItem,
} from "@autopainel/shared/ui";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface AdminNotificationContextValue {
  unreadCount: number;
  openCenter: () => void;
}

const AdminNotificationContext = createContext<AdminNotificationContextValue | null>(
  null,
);

const READ_SCOPE = "admin-platform-ops";
const REFRESH_INTERVAL_MS = 90_000;

function sortNotifications(items: NotificationCenterItem[]): NotificationCenterItem[] {
  return [...items].sort((left, right) => {
    const leftTime = left.createdAt ? Date.parse(left.createdAt) : 0;
    const rightTime = right.createdAt ? Date.parse(right.createdAt) : 0;
    return rightTime - leftTime;
  });
}

function mergeNotificationItems(
  current: NotificationCenterItem[],
  incoming: NotificationCenterItem[],
): NotificationCenterItem[] {
  const map = new Map<string, NotificationCenterItem>();
  for (const item of [...incoming, ...current]) {
    map.set(item.id, item);
  }
  return sortNotifications(Array.from(map.values())).slice(0, 30);
}

async function fetchPlatformNotifications(
  supabase: ReturnType<typeof createSupabaseBrowserClient>,
): Promise<NotificationCenterItem[]> {
  const [billingResult, dealershipsResult] = await Promise.all([
    supabase
      .from("dealership_billing_history")
      .select(
        "id, billing_period_start, expected_amount, settlement_status, due_date, created_at, updated_at, dealerships(id, name, slug)",
      )
      .in("settlement_status", ["overdue", "pending"])
      .order("due_date", { ascending: true })
      .limit(40),
    supabase
      .from("dealerships")
      .select("id, name, status, updated_at")
      .in("status", ["pending_setup", "suspended", "churned"])
      .order("updated_at", { ascending: false })
      .limit(15),
  ]);

  const billingItems =
    billingResult.error || !billingResult.data
      ? []
      : billingResult.data
          .map((row) => {
            if (
              row.settlement_status === "pending" &&
              row.due_date &&
              !isBillingAlertDueSoon(row.due_date)
            ) {
              return null;
            }
            return mapBillingHistoryNotification(row);
          })
          .filter((item): item is NotificationCenterItem => item !== null);

  const statusItems =
    dealershipsResult.error || !dealershipsResult.data
      ? []
      : dealershipsResult.data
          .map((row) => mapDealershipStatusNotification(row))
          .filter((item): item is NotificationCenterItem => item !== null);

  return mergeNotificationItems([], [...billingItems, ...statusItems]);
}

export function AdminNotificationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationCenterItem[]>([]);

  const { itemsWithRead, unreadCount, markAllRead, handleItemActivate } =
    useNotificationReadState(READ_SCOPE, items);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      const supabase = createSupabaseBrowserClient();
      const nextItems = await fetchPlatformNotifications(supabase);
      if (!cancelled) {
        setItems(nextItems);
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    const intervalId = window.setInterval(() => {
      void loadNotifications();
    }, REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      unreadCount,
      openCenter: () => setIsOpen(true),
    }),
    [unreadCount],
  );

  return (
    <AdminNotificationContext.Provider value={contextValue}>
      {children}
      <NotificationCenterSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        items={itemsWithRead}
        title="Operação AutoPainel"
        description="Mensalidades, vencimentos e alertas operacionais da plataforma."
        emptyMessage="Nenhum alerta operacional no momento."
        footerLink={{ href: "/painel/financeiro", label: "Ir para financeiro" }}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
        onItemActivate={handleItemActivate}
      />
    </AdminNotificationContext.Provider>
  );
}

export function AdminNotificationTrigger({ className }: { className?: string }) {
  const context = useContext(AdminNotificationContext);

  if (!context) {
    return null;
  }

  return (
    <NotificationBellTrigger
      unreadCount={context.unreadCount}
      onClick={context.openCenter}
      className={className}
    />
  );
}
