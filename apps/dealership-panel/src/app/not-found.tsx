import { AppSystemStatusPage } from "@autopainel/shared/components/system/app-system-status-page";

export default function NotFound() {
  return (
    <AppSystemStatusPage
      kind="not-found"
      tone="panel"
      primaryAction={{ label: "Ir para o painel", href: "/painel" }}
      secondaryAction={{ label: "Login", href: "/login" }}
    />
  );
}
