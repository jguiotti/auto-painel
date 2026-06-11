import type { ClassifiedsProviderBlockReason } from "@autopainel/shared/types/integrations-hub";

interface ProviderUnavailableStateProps {
  providerLabel: string;
  blockReason: ClassifiedsProviderBlockReason;
}

export function ProviderUnavailableState({
  providerLabel,
  blockReason,
}: ProviderUnavailableStateProps) {
  if (blockReason === "available" || blockReason === "disconnected") {
    return null;
  }

  if (blockReason === "module_inactive") {
    return (
      <p className="text-xs text-muted-foreground">
        Recurso do plano Enterprise. Fale com seu gerente de conta para fazer upgrade.
      </p>
    );
  }

  if (blockReason === "reauth_required") {
    return (
      <p className="text-xs text-amber-700 dark:text-amber-400">
        Sua sessão na {providerLabel} expirou. Clique em Reconectar para voltar a publicar.
      </p>
    );
  }

  return (
    <p className="text-xs text-muted-foreground">
      A conexão com a {providerLabel} ainda não está disponível para sua loja. Fale com nosso
      suporte para solicitar a ativação deste canal.
    </p>
  );
}
