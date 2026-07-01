import { isIntegrationsMockModeEnabled } from "@autopainel/shared/lib/integrations-mock-mode";

export function IntegrationsMockBanner() {
  if (!isIntegrationsMockModeEnabled()) {
    return null;
  }

  return (
    <div
      className="rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
      role="status"
    >
      <p className="font-medium">Modo gravação — simulação ativa</p>
      <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
        Conexão Meta, preview do carrossel e publicação são simulados localmente. Nenhuma chamada
        real ao Facebook ou Instagram. Desative <code className="text-xs">INTEGRATIONS_MOCK_MODE</code>{" "}
        antes do go-live.
      </p>
    </div>
  );
}
