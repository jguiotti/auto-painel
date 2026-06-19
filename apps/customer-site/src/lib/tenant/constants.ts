export const COOKIE_DEALERSHIP_ID = "ap-dealership-id";

/** Repassado pelo middleware no mesmo ciclo de request (cookies ainda não leem o valor recém-definido). */
export const HEADER_DEALERSHIP_ID = "x-ap-dealership-id";

export const HEADER_DEALERSHIP_STATUS = "x-ap-dealership-status";

export const INACTIVE_STOREFRONT_PATH = "/loja-inativa";

export type StorefrontTenantStatus =
  | "active"
  | "suspended"
  | "pending_setup"
  | "churned";

export interface ResolvedStorefrontTenant {
  dealershipId: string;
  slug: string;
  name: string;
  status: StorefrontTenantStatus;
}
