export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Mask as NN.NNN.NNN/NNNN-NN (14 digits). */
export function formatCnpjMasked(value: string): string {
  const d = digitsOnly(value).slice(0, 14);
  if (d.length === 0) {
    return "";
  }
  let out = d.slice(0, 2);
  if (d.length > 2) {
    out += `.${d.slice(2, 5)}`;
  }
  if (d.length > 5) {
    out += `.${d.slice(5, 8)}`;
  }
  if (d.length > 8) {
    out += `/${d.slice(8, 12)}`;
  }
  if (d.length > 12) {
    out += `-${d.slice(12, 14)}`;
  }
  return out;
}

export function formatCepMasked(value: string): string {
  const d = digitsOnly(value).slice(0, 8);
  if (d.length <= 5) {
    return d;
  }
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function formatBrazilMobileMasked(value: string): string {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length === 0) {
    return "";
  }
  if (d.length <= 2) {
    return `(${d}`;
  }
  if (d.length <= 6) {
    return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  }
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function normalizeDomainHostname(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "");
  s = s.replace(/\/.*$/, "");
  return s;
}
