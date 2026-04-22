"use client";

import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface LeadRealtimeNotifierProps {
  dealershipId: string;
}

export function LeadRealtimeNotifier({
  dealershipId,
}: LeadRealtimeNotifierProps) {
  const [banner, setBanner] = useState<{ title: string } | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`dealership-${dealershipId}-leads`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
          filter: `dealership_id=eq.${dealershipId}`,
        },
        (payload) => {
          const row = payload.new as { client_name?: string };
          setBanner({
            title: row.client_name?.trim() || "Novo contato",
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [dealershipId]);

  useEffect(() => {
    if (!banner) {
      return;
    }
    const timer = globalThis.setTimeout(() => setBanner(null), 10000);
    return () => globalThis.clearTimeout(timer);
  }, [banner]);

  if (!banner) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-[100] max-w-sm rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950 shadow-lg dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-50"
    >
      <p className="text-sm font-semibold">Novo lead na vitrine</p>
      <p className="mt-1 text-sm">{banner.title}</p>
      <p className="mt-2 text-xs opacity-80">
        Confira em Contatos ou atualize a página.
      </p>
    </div>
  );
}
