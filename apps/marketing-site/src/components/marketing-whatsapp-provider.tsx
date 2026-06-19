"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { MarketingWhatsAppLeadDialog } from "@/components/marketing-whatsapp-lead-dialog";

interface MarketingWhatsAppContextValue {
  openMarketingWhatsAppDialog: () => void;
}

const MarketingWhatsAppContext =
  createContext<MarketingWhatsAppContextValue | null>(null);

export function MarketingWhatsAppProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openMarketingWhatsAppDialog = useCallback(() => {
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
