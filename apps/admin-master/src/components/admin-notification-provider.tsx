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

interface AdminNotificationContextValue {
  unreadCount: number;
  openCenter: () => void;
}

const AdminNotificationContext = createContext<AdminNotificationContextValue | null>(
  null,
);

const READ_SCOPE = "admin-platform-leads";

function mapPlatformLeadRow(row: {
  id?: string;
  client_name?: string | null;
  type?: string | null;
  created_at?: string | null;
  dealerships?: { name?: string | null; slug?: string | null } | null;
}): NotificationCenterItem {
  const dealershipName = row.dealerships?.name?.trim() || "Concessionária";
  const typeLabel = row.type === "simulation" ? "Simulação" : "Contato";
  const slug = row.dealerships?.slug?.trim();

  return {
    id: row.id ?? crypto.randomUUID(),
    title: row.client_name?.trim() || "Novo interessado",
    subtitle: `${typeLabel} · ${dealershipName}`,
    href: slug ? `/painel/concessionarias` : "/painel/dashboard",
    createdAt: row.created_at ?? undefined,
  };
}

export function AdminNotificationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<NotificationCenterItem[]>([]);

  const { itemsWithRead, unreadCount, markAllRead, handleItemActivate } =
    useNotificationReadState(READ_SCOPE, items);

  const pushNotification = useCallback((item: NotificationCenterItem) => {
    setItems((current) => {
      if (current.some((entry) => entry.id === item.id)) {
        return current;
      }
      return [item, ...current].slice(0, 25);
    });
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    void supabase
      .from("leads")
      .select("id, client_name, type, created_at, dealerships(name, slug)")
      .order("created_at", { ascending: false })
      .limit(25)
      .then(({ data }) => {
        if (!data) {
          return;
        }
        setItems(data.map((row) => mapPlatformLeadRow(row)));
      });

    const channel = supabase
      .channel("admin-platform-lead-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
        },
        (payload) => {
          const row = payload.new as {
            id?: string;
            client_name?: string | null;
            type?: string | null;
            created_at?: string | null;
          };
          pushNotification({
            id: row.id ?? crypto.randomUUID(),
            title: row.client_name?.trim() || "Novo interessado",
            subtitle:
              row.type === "simulation"
                ? "Simulação · nova intenção de compra"
                : "Contato · nova intenção de compra",
            href: "/painel/dashboard",
            createdAt: row.created_at ?? undefined,
          });
          setIsOpen(true);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [pushNotification]);

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
        title="Atividade da plataforma"
        description="Intenções de compra e simulações recebidas nas lojas."
        emptyMessage="Nenhuma notificação recente na plataforma."
        footerLink={{ href: "/painel/dashboard", label: "Ir para o painel" }}
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
