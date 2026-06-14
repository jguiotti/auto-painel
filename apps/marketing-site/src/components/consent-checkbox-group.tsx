"use client";

import Link from "next/link";

import { Label } from "@autopainel/shared/ui";

import { PRIVACY_POLICY_VERSION } from "@/lib/legal/constants";

interface ConsentCheckboxGroupProps {
  disabled?: boolean;
}

export function ConsentCheckboxGroup({ disabled = false }: ConsentCheckboxGroupProps) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-border/60 bg-card/50 p-4" disabled={disabled}>
      <legend className="sr-only">Consentimentos</legend>
      <div className="flex items-start gap-3">
        <input
          id="privacy_consent"
          name="privacy_consent"
          type="checkbox"
          value="true"
          required
          disabled={disabled}
          className="mt-1 size-4 shrink-0 rounded border-border accent-marketing-accent"
        />
        <Label htmlFor="privacy_consent" className="cursor-pointer font-normal leading-snug">
          Li e aceito a{" "}
          <Link href="/politica-de-privacidade" className="text-marketing-accent hover:underline">
            Política de Privacidade
          </Link>{" "}
          (versão {PRIVACY_POLICY_VERSION}). <span className="text-destructive">*</span>
        </Label>
      </div>
      <div className="flex items-start gap-3">
        <input
          id="marketing_consent"
          name="marketing_consent"
          type="checkbox"
          value="true"
          disabled={disabled}
          className="mt-1 size-4 shrink-0 rounded border-border accent-marketing-accent"
        />
        <Label htmlFor="marketing_consent" className="cursor-pointer font-normal leading-snug">
          Autorizo a AutoPainel a entrar em contato por e-mail ou WhatsApp sobre produtos e
          novidades (opcional).
        </Label>
      </div>
    </fieldset>
  );
}
