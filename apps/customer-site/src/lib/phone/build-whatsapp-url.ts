function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function buildWhatsAppUrl(phone: string, message?: string): string {
  const n = digitsOnly(phone);
  if (!n) {
    return "#";
  }
  const base = `https://wa.me/${n}`;
  if (message && message.trim()) {
    return `${base}?text=${encodeURIComponent(message.trim())}`;
  }
  return base;
}
