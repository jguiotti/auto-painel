"use client";

import { createContext, useContext } from "react";

import type { AuthDealershipBranding } from "@/lib/auth/resolve-auth-dealership-branding";

const AuthBrandingContext = createContext<AuthDealershipBranding | null>(null);

interface AuthBrandingProviderProps {
  branding: AuthDealershipBranding | null;
  children: React.ReactNode;
}

export function AuthBrandingProvider({
  branding,
  children,
}: AuthBrandingProviderProps) {
  return (
    <AuthBrandingContext.Provider value={branding}>
      {children}
    </AuthBrandingContext.Provider>
  );
}

export function useAuthDealershipBranding(): AuthDealershipBranding | null {
  return useContext(AuthBrandingContext);
}
