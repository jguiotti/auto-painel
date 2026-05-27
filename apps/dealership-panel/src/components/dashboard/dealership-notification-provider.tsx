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

function mapLeadRow(row: {
  id?: string;
  client_name?: string | null;
  type?: string | null;
  created_at?: string | null;
}): NotificationCenterItem {
  const typeLabel = row.type === "simulation" ? "Simulação" : "Contato";
  return {
    id: row.id ?? crypto.randomUUID(),
    title: row.client_name?.trim() || "Novo interessado",
    subtitle: `${typeLabel} · intenção de compra na vitrine`,
    href: "/painel/contatos",
    createdAt: row.created_at ?? undefined,
  };
}

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
  const readScope = `dealership-${dealershipId}-leads`;

  const { itemsWithRead, unreadCount, markAllRead, handleItemActivate } =
    useNotificationReadState(readScope, items);

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
      .select("id, client_name, type, created_at")
      .eq("dealership_id", dealershipId)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!data) {
          return;
        }
        setItems(data.map((row) => mapLeadRow(row)));
      });

    const channel = supabase
      .channel(`dealership-${dealershipId}-lead-notifications`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          filter: `dealership_id=eq.${dealershipId}`,
        },
        (payload) => {
          pushNotification(mapLeadRow(payload.new as Parameters<typeof mapLeadRow>[0]));
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
        description="Intenções de compra e simulações recebidas pela vitrine."
        emptyMessage="Nenhuma notificação recente. Quando alguém entrar em contato, avisamos aqui."
        footerLink={{ href: "/painel/contatos", label: "Ver todos os contatos" }}
        unreadCount={unreadCount}
        onMarkAllRead={markAllRead}
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
