"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNotificationReadState } from "@autopainel/shared/hooks/use-notification-read-state";
import {
  isStorefrontLeadSource,
  mapDealershipLeadNotification,
} from "@autopainel/shared/lib/notifications/lead-notification-items";
import {
  NotificationBellTrigger,
  NotificationCenterSheet,
  type NotificationCenterItem,
} from "@autopainel/shared/ui";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface DealershipNotificationContextValue {
  unreadCount: number;
  openCenter: () => void;
}

const DealershipNotificationContext =
  createContext<DealershipNotificationContextValue | null>(null);

interface DealershipNotificationProviderProps {
  dealershipId: string;
  enabled: boolean;
  children: React.ReactNode;
}

export function DealershipNotificationProvider({
  dealershipId,
  enabled,
  children,
}: DealershipNotificationProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationCenterItem[]>([]);
  const readScope = `dealership-${dealershipId}-storefront-leads`;

  const { itemsWithRead, unreadCount, markAllRead, markRead, dismiss, handleItemActivate } =
    useNotificationReadState(readScope, items);

  const handleMarkRead = useCallback(
    (item: NotificationCenterItem) => {
      markRead(item.id);
    },
    [markRead],
  );

  const handleDismiss = useCallback(
    (item: NotificationCenterItem) => {
      dismiss(item.id);
    },
    [dismiss],
  );

  const pushNotification = useCallback((item: NotificationCenterItem) => {
    setItems((current) => {
      if (current.some((entry) => entry.id === item.id)) {
        return current;
      }
      return [item, ...current].slice(0, 20);
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const supabase = createSupabaseBrowserClient();

    void supabase
      .from("leads")
      .select("id, client_name, type, source, created_at")
      .eq("dealership_id", dealershipId)
      .neq("source", "manual")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!data) {
          return;
        }
        const mapped = data
          .map((row) => mapDealershipLeadNotification(row))
          .filter((item): item is NotificationCenterItem => item !== null);
        setItems(mapped);
      });

    const channel = supabase
      .channel(`dealership-${dealershipId}-storefront-lead-notifications`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          filter: `dealership_id=eq.${dealershipId}`,
        },
        (payload) => {
          const row = payload.new as Parameters<typeof mapDealershipLeadNotification>[0];
          if (!isStorefrontLeadSource(row.source)) {
            return;
          }
          const item = mapDealershipLeadNotification(row);
          if (!item) {
            return;
          }
          pushNotification(item);
          setIsOpen(true);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [dealershipId, enabled, pushNotification]);

  const contextValue = useMemo(
    () => ({
      unreadCount: enabled ? unreadCount : 0,
      openCenter: () => setIsOpen(true),
    }),
    [enabled, unreadCount],
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <DealershipNotificationContext.Provider value={contextValue}>
      {children}
      <NotificationCenterSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        items={itemsWithRead}
        title="Novidades da loja"
        description="Leads e simulações recebidos pela vitrine desta concessionária."
        emptyMessage="Nenhuma notificação recente. Quando alguém entrar em contato pela vitrine, avisamos aqui."
        footerLink={{ href: "/painel/contatos", label: "Ver todos os contatos" }}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
        onMarkRead={handleMarkRead}
        onDismiss={handleDismiss}
        onItemActivate={handleItemActivate}
      />
    </DealershipNotificationContext.Provider>
  );
}

export function DealershipNotificationTrigger({ className }: { className?: string }) {
  const context = useContext(DealershipNotificationContext);

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
