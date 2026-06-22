import { AppSystemStatusPage } from "@autopainel/shared/components/system/app-system-status-page";

export default function NotFound() {
  return (
    <AppSystemStatusPage
      kind="not-found"
      tone="admin"
      primaryAction={{ label: "Ir ao painel", href: "/painel/dashboard" }}
      secondaryAction={{ label: "Login", href: "/login" }}
    />
  );
}
