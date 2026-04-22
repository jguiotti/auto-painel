"use client";

import { createContext, useContext } from "react";

import type { DealershipPublicRecord } from "@/components/public/PublicSiteShell";

const PublicDealershipContext = createContext<DealershipPublicRecord | null>(
  null,
);

interface PublicDealershipProviderProps {
  value: DealershipPublicRecord | null;
  children: React.ReactNode;
}

export function PublicDealershipProvider({
  value,
  children,
}: PublicDealershipProviderProps) {
  return (
    <PublicDealershipContext.Provider value={value}>
      {children}
    </PublicDealershipContext.Provider>
  );
}

export function usePublicDealership(): DealershipPublicRecord | null {
  return useContext(PublicDealershipContext);
}
