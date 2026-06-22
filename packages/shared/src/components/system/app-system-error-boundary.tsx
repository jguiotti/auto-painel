"use client";

import { useEffect } from "react";

import { AppSystemStatusPage } from "./app-system-status-page";
import type { AppSystemStatusTone } from "./app-system-status-page";

interface AppSystemErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  tone?: AppSystemStatusTone;
  homeHref?: string;
}

export function AppSystemErrorBoundary({
  error,
  reset,
  tone = "admin",
  homeHref = "/",
}: AppSystemErrorBoundaryProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <AppSystemStatusPage
      kind="server-error"
      tone={tone}
      primaryAction={{ label: "Tentar novamente", onClick: reset }}
      secondaryAction={{ label: "Ir para o início", href: homeHref }}
    />
  );
}
