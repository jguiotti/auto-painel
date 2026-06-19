"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@autopainel/shared/ui";

import { claimLeadAction } from "@/app/painel/contatos/actions";

interface LeadClaimButtonProps {
  leadId: string;
  canClaim: boolean;
  size?: "sm" | "default";
  className?: string;
}

export function LeadClaimButton({
  leadId,
  canClaim,
  size = "sm",
  className,
}: LeadClaimButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!canClaim) {
    return null;
  }

  function handleClaim() {
    setError(null);
    startTransition(async () => {
      const result = await claimLeadAction(leadId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className={className}>
      <Button
        type="button"
        size={size}
        variant="secondary"
        disabled={pending}
        onClick={handleClaim}
      >
        {pending ? "Assumindo…" : "Assumir lead"}
      </Button>
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
