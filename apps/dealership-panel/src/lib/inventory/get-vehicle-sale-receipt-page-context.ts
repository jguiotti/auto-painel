import "server-only";

import { isSaleReceiptModuleEnabled } from "@autopainel/shared/lib/dealership-features";
import { resolveDealershipLogoForLightBackground } from "@autopainel/shared/lib/theme/branding";
import { resolveVehicleTypeLabel } from "@autopainel/shared/lib/vehicle/vehicle-type-labels";
import type { VehicleSaleReceiptRecord } from "@autopainel/shared/types/sale-receipt";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";
import { formatBrl } from "@/lib/format/format-brl";
import { mapSaleReceiptRow } from "@/lib/inventory/map-sale-receipt-row";

export interface SaleReceiptDealershipHeader {
  name: string;
  logoUrl: string | null;
  cnpj: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface SaleReceiptVehicleSummary {
  id: string;
  brand: string;
  model: string;
  version: string | null;
  vehicleTypeLabel: string;
  manufacturingYear: number;
  modelYear: number;
  mileage: number;
  salePrice: number;
  salePriceFormatted: string;
  licensePlate: string | null;
  renavam: string | null;
  status: string;
  vehicleType: string;
  vehicleTypeCustom: string | null;
}

export interface SaleReceiptLeadOption {
  id: string;
  client_name: string;
  phone: string;
  client_email: string | null;
  document_cpf: string | null;
  billing_address: string | null;
}

export interface SaleReceiptPageContext {
  enabled: boolean;
  vehicle: SaleReceiptVehicleSummary;
  dealership: SaleReceiptDealershipHeader;
  receipt: VehicleSaleReceiptRecord | null;
  leadOptions: SaleReceiptLeadOption[];
  error?: string;
}

function parseHqAddress(contentConfig: unknown): string | null {
  if (!contentConfig || typeof contentConfig !== "object") {
    return null;
  }
  const address = (contentConfig as { hq_address?: unknown }).hq_address;
  return typeof address === "string" && address.trim().length > 0 ? address.trim() : null;
}

export async function getVehicleSaleReceiptPageContext(
  vehicleId: string,
): Promise<SaleReceiptPageContext> {
  const { supabase, dealershipId } = await requireDashboardSession(
    `/painel/estoque/${vehicleId}/recibo`,
  );

  const [featuresRes, vehicleResult, dealershipResult, receiptResult, leadsResult] =
    await Promise.all([
    supabase.rpc("effective_feature_keys_for_active_dealership", {
      p_dealership_id: dealershipId,
    }),
    supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicleId)
      .eq("dealership_id", dealershipId)
      .maybeSingle(),
    supabase
      .from("dealerships")
      .select("name, cnpj, logo_url, theme_config, contact_email, whatsapp_number, content_config")
      .eq("id", dealershipId)
      .maybeSingle(),
    supabase
      .from("vehicle_sale_receipts")
      .select("*")
      .eq("vehicle_id", vehicleId)
      .eq("dealership_id", dealershipId)
      .maybeSingle(),
    supabase
      .from("leads")
      .select(
        "id, client_name, phone, client_email, customer_id, customers(document_cpf, billing_address)",
      )
      .eq("dealership_id", dealershipId)
      .or(`vehicle_id.eq.${vehicleId},converted_vehicle_id.eq.${vehicleId}`)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const activeFeatures = Array.isArray(featuresRes.data)
    ? featuresRes.data.filter((entry): entry is string => typeof entry === "string")
    : [];
  const enabled = isSaleReceiptModuleEnabled(activeFeatures);

  if (vehicleResult.error) {
    return {
      enabled,
      vehicle: emptyVehicleSummary(vehicleId),
      dealership: emptyDealershipHeader(),
      receipt: null,
      leadOptions: [],
      error: "Não foi possível carregar os dados do veículo. Verifique se as migrações de recibo foram aplicadas no Supabase.",
    };
  }

  const vehicle = vehicleResult.data;
  const dealership = dealershipResult.data;

  if (!vehicle) {
    return {
      enabled,
      vehicle: emptyVehicleSummary(vehicleId),
      dealership: emptyDealershipHeader(),
      receipt: null,
      leadOptions: [],
      error: "Veículo não encontrado nesta loja.",
    };
  }

  if (dealershipResult.error || !dealership) {
    return {
      enabled,
      vehicle: buildVehicleSummary(vehicle),
      dealership: emptyDealershipHeader(),
      receipt: null,
      leadOptions: [],
      error: "Não foi possível carregar os dados da concessionária.",
    };
  }

  if (!enabled) {
    return {
      enabled: false,
      vehicle: buildVehicleSummary(vehicle),
      dealership: buildDealershipHeader(dealership),
      receipt: null,
      leadOptions: [],
      error: "A emissão de recibo de venda não está incluída no plano da sua loja.",
    };
  }

  if (vehicle.status !== "sold") {
    return {
      enabled: true,
      vehicle: buildVehicleSummary(vehicle),
      dealership: buildDealershipHeader(dealership),
      receipt: null,
      leadOptions: [],
      error: "Só é possível emitir recibo para veículos marcados como vendidos.",
    };
  }

  const receipt = receiptResult.error
    ? null
    : receiptResult.data
      ? mapSaleReceiptRow(receiptResult.data as Parameters<typeof mapSaleReceiptRow>[0])
      : null;

  const leadOptions = mapSaleReceiptLeadOptions(leadsResult.data);

  return {
    enabled: true,
    vehicle: buildVehicleSummary(vehicle),
    dealership: buildDealershipHeader(dealership),
    receipt,
    leadOptions,
  };
}

function emptyVehicleSummary(vehicleId: string): SaleReceiptVehicleSummary {
  return {
    id: vehicleId,
    brand: "",
    model: "",
    version: null,
    vehicleTypeLabel: "",
    manufacturingYear: 0,
    modelYear: 0,
    mileage: 0,
    salePrice: 0,
    salePriceFormatted: formatBrl(0),
    licensePlate: null,
    renavam: null,
    status: "available",
    vehicleType: "",
    vehicleTypeCustom: null,
  };
}

function emptyDealershipHeader(): SaleReceiptDealershipHeader {
  return {
    name: "",
    logoUrl: null,
    cnpj: null,
    address: null,
    phone: null,
    email: null,
  };
}

function buildVehicleSummary(vehicle: {
  id: string;
  brand: string;
  model: string;
  version?: string | null;
  vehicle_type: string;
  vehicle_type_custom?: string | null;
  manufacturing_year: number;
  model_year: number;
  mileage: number;
  sale_price?: number | null;
  price: number;
  status: string;
  license_plate?: string | null;
  renavam?: string | null;
}): SaleReceiptVehicleSummary {
  const salePrice = Number(vehicle.sale_price ?? vehicle.price);
  return {
    id: vehicle.id,
    brand: vehicle.brand,
    model: vehicle.model,
    version: vehicle.version ?? null,
    vehicleTypeLabel: resolveVehicleTypeLabel(
      vehicle.vehicle_type,
      vehicle.vehicle_type_custom ?? null,
    ),
    manufacturingYear: vehicle.manufacturing_year,
    modelYear: vehicle.model_year,
    mileage: vehicle.mileage,
    salePrice,
    salePriceFormatted: formatBrl(salePrice),
    licensePlate: vehicle.license_plate ?? null,
    renavam: vehicle.renavam ?? null,
    status: vehicle.status,
    vehicleType: vehicle.vehicle_type,
    vehicleTypeCustom: vehicle.vehicle_type_custom ?? null,
  };
}

function buildDealershipHeader(dealership: {
  name: string;
  cnpj: string | null;
  logo_url: string | null;
  theme_config?: unknown;
  contact_email: string | null;
  whatsapp_number: string | null;
  content_config: unknown;
}): SaleReceiptDealershipHeader {
  return {
    name: dealership.name,
    logoUrl: resolveDealershipLogoForLightBackground(dealership.theme_config ?? null, dealership.logo_url),
    cnpj: dealership.cnpj?.trim() || null,
    address: parseHqAddress(dealership.content_config),
    phone: dealership.whatsapp_number?.trim() || null,
    email: dealership.contact_email?.trim() || null,
  };
}

function formatBillingAddress(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const parts = [
    record.street,
    record.number,
    record.complement,
    record.district,
    record.city,
    record.state,
    record.postal_code,
  ]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .map((part) => part.trim());
  return parts.length > 0 ? parts.join(", ") : null;
}

function mapSaleReceiptLeadOptions(rows: unknown): SaleReceiptLeadOption[] {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    const record = row as {
      id: string;
      client_name: string;
      phone: string;
      client_email: string | null;
      customers?:
        | { document_cpf: string | null; billing_address: unknown }
        | Array<{ document_cpf: string | null; billing_address: unknown }>
        | null;
    };
    const customer = Array.isArray(record.customers)
      ? record.customers[0]
      : record.customers;

    return {
      id: record.id,
      client_name: record.client_name,
      phone: record.phone,
      client_email: record.client_email,
      document_cpf: customer?.document_cpf ?? null,
      billing_address: formatBillingAddress(customer?.billing_address),
    };
  });
}
