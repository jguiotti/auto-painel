import type { CustomerBillingAddress } from "../../types/customer-crm";
import type { BrazilianAddressFields } from "../../types";

export function billingAddressFromRecord(
  value: unknown,
): CustomerBillingAddress {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;
  const read = (key: string) => {
    const raw = record[key];
    return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : undefined;
  };

  return {
    street: read("street"),
    number: read("number"),
    complement: read("complement"),
    neighborhood: read("neighborhood") ?? read("district"),
    city: read("city"),
    state: read("state"),
    postal_code: read("postal_code"),
  };
}

export function billingAddressToBrazilianFields(
  address: CustomerBillingAddress | undefined,
): BrazilianAddressFields {
  return {
    postal_code: address?.postal_code ?? "",
    state: address?.state ?? "",
    city: address?.city ?? "",
    district: address?.neighborhood ?? "",
    street: address?.street ?? "",
    number: address?.number ?? "",
    complement: address?.complement ?? "",
  };
}

export function formatCustomerBillingAddress(
  address: CustomerBillingAddress | undefined,
): string | null {
  if (!address) {
    return null;
  }

  const parts = [
    address.street,
    address.number,
    address.complement,
    address.neighborhood,
    address.city,
    address.state,
    address.postal_code,
  ].filter((part): part is string => Boolean(part?.trim()));

  return parts.length > 0 ? parts.join(", ") : null;
}

export function billingAddressForStorage(
  address: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(address)) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }
    if (key === "neighborhood") {
      out.district = trimmed;
      continue;
    }
    out[key] = trimmed;
  }
  return out;
}
