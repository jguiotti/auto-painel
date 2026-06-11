"use client";

import { useTransition } from "react";

import { Button } from "@autopainel/shared/ui";

import { dismissIntegrationsOnboardingAction } from "@/app/painel/integracoes/actions";

interface IntegrationOnboardingBannerProps {
  visible: boolean;
}

export function IntegrationOnboardingBanner({ visible }: IntegrationOnboardingBannerProps) {
  const [isPending, startTransition] = useTransition();

  if (!visible) {
    return null;
  }

  function handleDismiss() {
    startTransition(async () => {
      await dismissIntegrationsOnboardingAction();
    });
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          Divulgue seu estoque em poucos cliques
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Conecte suas contas aqui e publique veículos direto do estoque.
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
        <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={handleDismiss}>
          Entendi
        </Button>
      </div>
    </div>
  );
}
