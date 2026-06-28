const CPF_LENGTH = 11;
const CNPJ_LENGTH = 14;

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function allSameDigits(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

function computeCpfCheckDigit(digits: string, factorStart: number): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    sum += Number(digits[i]) * (factorStart - i);
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCpf(raw: string): boolean {
  const digits = stripNonDigits(raw);
  if (digits.length !== CPF_LENGTH || allSameDigits(digits)) {
    return false;
  }

  const base = digits.slice(0, 9);
  const firstCheck = computeCpfCheckDigit(base, 10);
  const secondCheck = computeCpfCheckDigit(`${base}${firstCheck}`, 11);
  return digits === `${base}${firstCheck}${secondCheck}`;
}

function computeCnpjCheckDigit(digits: string, weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i += 1) {
    sum += Number(digits[i]) * weights[i]!;
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCnpj(raw: string): boolean {
  const digits = stripNonDigits(raw);
  if (digits.length !== CNPJ_LENGTH || allSameDigits(digits)) {
    return false;
  }

  const firstWeights = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const secondWeights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const firstCheck = computeCnpjCheckDigit(digits.slice(0, 12), firstWeights);
  const secondCheck = computeCnpjCheckDigit(`${digits.slice(0, 12)}${firstCheck}`, secondWeights);
  return digits === `${digits.slice(0, 12)}${firstCheck}${secondCheck}`;
}

export type BuyerDocumentKind = "cpf" | "cnpj";

export interface BuyerDocumentValidationResult {
  isValid: boolean;
  kind: BuyerDocumentKind | null;
  normalized: string;
}

export function normalizeBuyerDocument(raw: string): string {
  return stripNonDigits(raw.trim());
}

export function validateBuyerDocument(raw: string): BuyerDocumentValidationResult {
  const normalized = normalizeBuyerDocument(raw);

  if (normalized.length === CPF_LENGTH && isValidCpf(normalized)) {
    return { isValid: true, kind: "cpf", normalized };
  }

  if (normalized.length === CNPJ_LENGTH && isValidCnpj(normalized)) {
    return { isValid: true, kind: "cnpj", normalized };
  }

  return { isValid: false, kind: null, normalized };
}

export function formatBuyerDocumentForDisplay(raw: string): string {
  const normalized = normalizeBuyerDocument(raw);
  if (normalized.length === CPF_LENGTH) {
    return normalized.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (normalized.length === CNPJ_LENGTH) {
    return normalized.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  }
  return raw.trim();
}
