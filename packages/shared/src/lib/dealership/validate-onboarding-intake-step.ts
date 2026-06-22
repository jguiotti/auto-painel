import { digitsOnly } from "../br/format-input-masks";
import type { DealershipOnboardingIntakePayload } from "../../types/dealership-onboarding-intake";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_RE =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function validateOnboardingIntakeStep(
  step: number,
  payload: DealershipOnboardingIntakePayload,
): string | null {
  if (step === 0) {
    if (payload.general.store_name.trim().length < 2) {
      return "Informe o nome da loja.";
    }
    const cnpj = digitsOnly(payload.general.cnpj);
    if (cnpj.length > 0 && cnpj.length !== 14) {
      return "Informe os 14 dígitos do CNPJ.";
    }
    if (!payload.general.slug.trim() || !SLUG_RE.test(payload.general.slug.trim())) {
      return "Informe um subdomínio válido (letras minúsculas, números e hífens).";
    }
    if (
      !payload.general.contact_email.trim() ||
      !EMAIL_RE.test(payload.general.contact_email.trim())
    ) {
      return "Informe um e-mail de contato válido.";
    }
    const whatsapp = digitsOnly(payload.general.whatsapp);
    if (whatsapp.length > 0 && (whatsapp.length < 10 || whatsapp.length > 11)) {
      return "Informe o WhatsApp com DDD.";
    }
    const cpf = digitsOnly(payload.general.legal_representative_cpf);
    if (cpf.length > 0 && cpf.length !== 11) {
      return "Informe os 11 dígitos do CPF do representante legal.";
    }
    return null;
  }

  if (step === 1) {
    if (
      payload.branding.primary_color &&
      !HEX_RE.test(payload.branding.primary_color)
    ) {
      return "Cor primária inválida. Use o formato #RRGGBB.";
    }
    if (
      payload.branding.primary_foreground_color &&
      !HEX_RE.test(payload.branding.primary_foreground_color)
    ) {
      return "Cor do texto sobre a primária inválida. Use #RRGGBB.";
    }
    if (
      payload.branding.secondary_color &&
      !HEX_RE.test(payload.branding.secondary_color)
    ) {
      return "Cor secundária inválida. Use #RRGGBB.";
    }
    return null;
  }

  return null;
}

export function validateOnboardingIntakePayload(
  payload: DealershipOnboardingIntakePayload,
): string | null {
  for (const step of [0, 1]) {
    const message = validateOnboardingIntakeStep(step, payload);
    if (message) {
      return message;
    }
  }
  return null;
}
