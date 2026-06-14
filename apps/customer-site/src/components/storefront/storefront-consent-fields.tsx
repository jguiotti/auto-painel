"use client";

import Link from "next/link";

import { Label } from "@autopainel/shared/ui";

import { STOREFRONT_LEGAL_VERSION } from "@/lib/legal/constants";

interface StorefrontConsentFieldsProps {
  disabled?: boolean;
  dealershipName: string;
}

export function StorefrontConsentFields({
  disabled = false,
  dealershipName,
}: StorefrontConsentFieldsProps) {
  return (
    <fieldset
      className="space-y-4 rounded-lg border border-[color-mix(in_srgb,var(--dealer-primary)_15%,transparent)] bg-[color-mix(in_srgb,var(--dealer-primary)_4%,transparent)] p-4"
      disabled={disabled}
    >
      <legend className="sr-only">Consentimentos</legend>
      <div className="flex items-start gap-3">
        <input
          id="privacy_consent"
          name="privacy_consent"
          type="checkbox"
          value="true"
          required
          disabled={disabled}
          className="mt-1 size-4 shrink-0 rounded border-[var(--dealer-fg)]/30 accent-[var(--dealer-primary)]"
        />
        <Label htmlFor="privacy_consent" className="cursor-pointer font-normal leading-snug">
          Li e aceito a{" "}
          <Link href="/politica-de-privacidade" className="text-[var(--dealer-primary)] hover:underline">
            Política de Privacidade
          </Link>{" "}
          (versão {STOREFRONT_LEGAL_VERSION}). <span className="text-red-600">*</span>
        </Label>
      </div>
      <div className="flex items-start gap-3">
        <input
          id="marketing_consent"
          name="marketing_consent"
          type="checkbox"
          value="true"
          disabled={disabled}
          className="mt-1 size-4 shrink-0 rounded border-[var(--dealer-fg)]/30 accent-[var(--dealer-primary)]"
        />
        <Label htmlFor="marketing_consent" className="cursor-pointer font-normal leading-snug">
          Autorizo a {dealershipName} a entrar em contato por e-mail ou WhatsApp sobre veículos e
          ofertas (opcional).
        </Label>
      </div>
    </fieldset>
  );
}
