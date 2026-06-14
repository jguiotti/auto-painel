import "server-only";

import type { BrazilianAddressFields, DealershipContentConfig } from "@autopainel/shared/types";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  formatBrazilianAddressLine,
  hasStructuredAddress,
} from "@/lib/address/format-brazilian-address";
import { getDealershipPublicRecord } from "@/lib/tenant/get-dealership-public-record";

export interface PublicDealershipUnitContact {
  id: string;
  name: string;
  addressLine: string | null;
  address: BrazilianAddressFields;
}

export interface DealershipContactData {
  dealershipName: string;
  contactEmail: string | null;
  whatsappNumber: string | null;
  hqAddressLine: string | null;
  legacyAddressLine: string | null;
  units: PublicDealershipUnitContact[];
}

function parseContentConfig(raw: unknown): DealershipContentConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as DealershipContentConfig;
}

export async function getDealershipContactData(): Promise<DealershipContactData | null> {
  const dealership = await getDealershipPublicRecord();
  if (!dealership?.id) {
    return null;
  }

  const content = parseContentConfig(dealership.content_config);
  const hqAddressLine = formatBrazilianAddressLine(content.hq_address);
  const legacyAddressLine = content.address?.trim() || null;

  const supabase = await createSupabaseServerClient();
  const { data: unitsRaw } = await supabase.rpc("list_dealership_public_units", {
    p_dealership_id: dealership.id,
  });

  const unitsList = Array.isArray(unitsRaw) ? unitsRaw : [];

  const units: PublicDealershipUnitContact[] = [];
  for (const row of unitsList) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const record = row as Record<string, unknown>;
    const address =
      record.address && typeof record.address === "object" && !Array.isArray(record.address)
        ? (record.address as BrazilianAddressFields)
        : {};
    if (!hasStructuredAddress(address)) {
      continue;
    }
    units.push({
      id: String(record.id ?? ""),
      name: String(record.name ?? "Unidade"),
      address,
      addressLine: formatBrazilianAddressLine(address),
    });
  }

  return {
    dealershipName: dealership.name,
    contactEmail: dealership.contact_email,
    whatsappNumber: dealership.whatsapp_number,
    hqAddressLine: hqAddressLine ?? legacyAddressLine,
    legacyAddressLine,
    units,
  };
}
