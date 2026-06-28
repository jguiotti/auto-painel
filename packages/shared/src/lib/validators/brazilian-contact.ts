import { digitsOnly } from "../br/format-input-masks";

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function normalizeBrazilPhoneDigits(raw: string): string {
  let digits = digitsOnly(raw);
  if (digits.startsWith("55") && digits.length >= 12) {
    digits = digits.slice(2);
  }
  return digits.slice(0, 11);
}

export function isValidContactEmail(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 254) {
    return false;
  }
  return EMAIL_RE.test(trimmed);
}

export function isValidBrazilMobilePhone(raw: string): boolean {
  const digits = normalizeBrazilPhoneDigits(raw);
  if (digits.length === 10) {
    return /^[1-9]{2}[2-9]\d{7}$/.test(digits);
  }
  if (digits.length === 11) {
    return /^[1-9]{2}9\d{8}$/.test(digits);
  }
  return false;
}
