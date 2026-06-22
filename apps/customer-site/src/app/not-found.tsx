import { AppSystemStatusPage } from "@autopainel/shared/components/system/app-system-status-page";

export default function NotFound() {
  return (
    <AppSystemStatusPage
      kind="not-found"
      tone="storefront"
      title="Página não encontrada"
      description="Este veículo ou endereço não existe na vitrine. Volte ao estoque ou fale com a loja."
      primaryAction={{ label: "Ver estoque", href: "/" }}
    />
  );
}
