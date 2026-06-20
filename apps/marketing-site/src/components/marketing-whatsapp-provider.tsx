"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { pushAutopainelAnalyticsEvent } from "@autopainel/shared/lib/analytics/push-autopainel-analytics-event";

import { MarketingWhatsAppLeadDialog } from "@/components/marketing-whatsapp-lead-dialog";

interface MarketingWhatsAppContextValue {
  openMarketingWhatsAppDialog: () => void;
}

const MarketingWhatsAppContext =
  createContext<MarketingWhatsAppContextValue | null>(null);

export function MarketingWhatsAppProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openMarketingWhatsAppDialog = useCallback(() => {
    pushAutopainelAnalyticsEvent({
      ap_event: "whatsapp_click",
      ap_event_category: "conversion",
      ap_event_label: "marketing_whatsapp_dialog",
    });
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ openMarketingWhatsAppDialog }),
    [openMarketingWhatsAppDialog],
  );

  return (
    <MarketingWhatsAppContext.Provider value={value}>
      {children}
      <MarketingWhatsAppLeadDialog open={open} onOpenChange={setOpen} />
    </MarketingWhatsAppContext.Provider>
  );
}

export function useMarketingWhatsApp(): MarketingWhatsAppContextValue {
  const context = useContext(MarketingWhatsAppContext);
  if (!context) {
    throw new Error(
      "useMarketingWhatsApp must be used within MarketingWhatsAppProvider",
    );
  }
  return context;
}
