import { digitsOnly } from "../br/format-input-masks";
import { isValidCnpj, isValidCpf } from "../validators/buyer-document";
import {
  isValidBrazilMobilePhone,
  isValidContactEmail,
} from "../validators/brazilian-contact";
import type { DealershipOnboardingIntakePayload } from "../../types/dealership-onboarding-intake";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export interface OnboardingIntakeStep0FieldErrors {
  store_name?: string;
  cnpj?: string;
  slug?: string;
  contact_email?: string;
  whatsapp?: string;
  legal_representative_name?: string;
  legal_representative_cpf?: string;
}

const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;

function validateOptionalCnpj(raw: string): string | undefined {
  const cnpj = digitsOnly(raw);
  if (!cnpj) {
    return undefined;
  }
  if (cnpj.length < CNPJ_LENGTH) {
    return "CNPJ incompleto. Informe 14 dígitos ou deixe em branco.";
  }
  if (!isValidCnpj(cnpj)) {
    return "CNPJ inválido. Verifique os números informados.";
  }
  return undefined;
}

function validateRequiredCpf(raw: string): string | undefined {
  const cpf = digitsOnly(raw);
  if (!cpf) {
    return "Informe o CPF do representante legal.";
  }
  if (cpf.length < CPF_LENGTH) {
    return "CPF incompleto. Informe 11 dígitos.";
  }
  if (!isValidCpf(cpf)) {
    return "CPF inválido. Verifique os números informados.";
  }
  return undefined;
}

export function slugifyStoreName(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function validateOnboardingIntakeStep0Fields(
  payload: DealershipOnboardingIntakePayload,
): OnboardingIntakeStep0FieldErrors {
  const errors: OnboardingIntakeStep0FieldErrors = {};

  if (payload.general.store_name.trim().length < 2) {
    errors.store_name = "Informe o nome comercial da loja (mínimo 2 caracteres).";
  }

  const cnpjError = validateOptionalCnpj(payload.general.cnpj);
  if (cnpjError) {
    errors.cnpj = cnpjError;
  }

  const slug = payload.general.slug.trim();
  if (!slug || !SLUG_RE.test(slug)) {
    errors.slug =
      "Informe um subdomínio válido (letras minúsculas, números e hífens, ex.: minhaloja).";
  }

  const email = payload.general.contact_email.trim();
  if (!email) {
    errors.contact_email = "Informe o e-mail de contato comercial.";
  } else if (!isValidContactEmail(email)) {
    errors.contact_email = "E-mail inválido. Ex.: contato@minhaloja.com.br";
  }

  const whatsapp = payload.general.whatsapp.trim();
  if (!whatsapp) {
    errors.whatsapp = "Informe o WhatsApp comercial com DDD.";
  } else if (!isValidBrazilMobilePhone(whatsapp)) {
    errors.whatsapp =
      "WhatsApp inválido. Use DDD + número (10 dígitos fixo ou 11 dígitos celular começando com 9).";
  }

  if (payload.general.legal_representative_name.trim().length < 3) {
    errors.legal_representative_name =
      "Informe o nome completo do representante legal.";
  }

  const cpfError = validateRequiredCpf(payload.general.legal_representative_cpf);
  if (cpfError) {
    errors.legal_representative_cpf = cpfError;
  }

  return errors;
}

export function firstOnboardingIntakeStep0Error(
  errors: OnboardingIntakeStep0FieldErrors,
): string | null {
  return (
    errors.store_name ??
    errors.cnpj ??
    errors.slug ??
    errors.contact_email ??
    errors.whatsapp ??
    errors.legal_representative_name ??
    errors.legal_representative_cpf ??
    null
  );
}

export function validateOnboardingIntakeStep(
  step: number,
  payload: DealershipOnboardingIntakePayload,
): string | null {
  if (step === 0) {
    return firstOnboardingIntakeStep0Error(validateOnboardingIntakeStep0Fields(payload));
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
