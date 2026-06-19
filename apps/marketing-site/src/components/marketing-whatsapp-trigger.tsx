"use client";

import type { ReactNode } from "react";

import { useMarketingWhatsApp } from "@/components/marketing-whatsapp-provider";

interface MarketingWhatsAppTriggerProps {
  children: ReactNode;
  className?: string;
}

export function MarketingWhatsAppTrigger({
  children,
  className,
}: MarketingWhatsAppTriggerProps) {
  const { openMarketingWhatsAppDialog } = useMarketingWhatsApp();

  return (
    <button type="button" className={className} onClick={openMarketingWhatsAppDialog}>
      {children}
    </button>
  );
}
