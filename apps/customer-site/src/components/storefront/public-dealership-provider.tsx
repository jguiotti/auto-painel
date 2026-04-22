"use client";

import { createContext, useContext } from "react";

import type { DealershipPublicRecord } from "@/types/dealership-public";

const PublicDealershipContext = createContext<DealershipPublicRecord | null>(
  null,
);

export function PublicDealershipProvider({
  value,
  children,
}: {
  value: DealershipPublicRecord | null;
  children: React.ReactNode;
}) {
  return (
    <PublicDealershipContext.Provider value={value}>
      {children}
    </PublicDealershipContext.Provider>
  );
}

export function usePublicDealership(): DealershipPublicRecord | null {
  return useContext(PublicDealershipContext);
}
