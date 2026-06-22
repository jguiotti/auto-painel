import { AppSystemStatusPage } from "@autopainel/shared/components/system/app-system-status-page";

export default function NotFound() {
  return (
    <AppSystemStatusPage
      kind="not-found"
      tone="marketing"
      primaryAction={{ label: "Ir para a home", href: "/" }}
      secondaryAction={{ label: "Falar conosco", href: "/contato" }}
    />
  );
}
