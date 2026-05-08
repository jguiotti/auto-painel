/**
 * Storefront shell variant for customer-site (configured in admin-master).
 */
export type StorefrontLayoutTemplateId = 1 | 2 | 3;

export function parseStorefrontLayoutId(
  raw: unknown,
): StorefrontLayoutTemplateId {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (n === 2) {
    return 2;
  }
  if (n === 3) {
    return 3;
  }
  return 1;
}
