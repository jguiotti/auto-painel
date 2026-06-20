import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import type {
  PlatformCommissionLedgerListRow,
  PlatformIncentiveCampaignRow,
  PlatformSalesAttributionListRow,
  PlatformSalesRepListRow,
} from "@/lib/data/platform-sales-squad-shared";
import type {
  PlatformSalesRepBankAccountRecord,
  PlatformSalesRepRecord,
} from "@autopainel/shared/types";

function getServiceClient() {
  try {
    return createSupabaseServiceRoleClient();
  } catch {
    return null;
  }
}

export async function fetchPlatformSalesReps(): Promise<PlatformSalesRepListRow[]> {
  const supabase = getServiceClient();
  if (!supabase) {
    return [];
  }

  const { data: reps, error } = await supabase
    .from("platform_sales_reps")
    .select(
      "id, full_name, email, phone, document_cpf, status, hire_date, termination_date, default_commission_rate_bps, user_id, notes, created_at, updated_at",
    )
    .order("full_name");

  if (error || !reps) {
    console.error("fetchPlatformSalesReps", error?.message);
    return [];
  }

  const repIds = reps.map((row) => row.id as string);
  if (repIds.length === 0) {
    return [];
  }

  const { data: counts } = await supabase
    .from("platform_sales_rep_dealership_attributions")
    .select("sales_rep_id")
    .eq("status", "confirmed")
    .in("sales_rep_id", repIds);

  const countByRep = new Map<string, number>();
  for (const row of counts ?? []) {
    const repId = row.sales_rep_id as string;
    countByRep.set(repId, (countByRep.get(repId) ?? 0) + 1);
  }

  return reps.map((row) => ({
    ...(row as PlatformSalesRepRecord),
    confirmed_attributions_count: countByRep.get(row.id as string) ?? 0,
  }));
}

export async function fetchPlatformSalesRepById(
  id: string,
): Promise<PlatformSalesRepRecord | null> {
  const supabase = getServiceClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("platform_sales_reps")
    .select(
      "id, full_name, email, phone, document_cpf, status, hire_date, termination_date, default_commission_rate_bps, user_id, notes, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PlatformSalesRepRecord;
}

export async function fetchPlatformSalesRepBankAccounts(
  salesRepId: string,
): Promise<PlatformSalesRepBankAccountRecord[]> {
  const supabase = getServiceClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("platform_sales_rep_bank_accounts")
    .select(
      "id, sales_rep_id, payment_method, pix_key_type, pix_key, bank_code, branch, account_number, account_holder_name, account_holder_document, is_primary, valid_from, valid_until, created_at, updated_at",
    )
    .eq("sales_rep_id", salesRepId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchPlatformSalesRepBankAccounts", error.message);
    return [];
  }

  return (data ?? []) as PlatformSalesRepBankAccountRecord[];
}

export async function fetchPlatformSalesAttributions(options?: {
  salesRepId?: string;
  dealershipId?: string;
}): Promise<PlatformSalesAttributionListRow[]> {
  const supabase = getServiceClient();
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("platform_sales_rep_dealership_attributions")
    .select(
      "id, sales_rep_id, dealership_id, saas_prospect_id, contract_id, attribution_type, attribution_share_bps, closed_at, first_invoice_amount_cents, plan_key, status, created_at, updated_at, dealerships(name), platform_sales_reps(full_name)",
    )
    .order("closed_at", { ascending: false });

  if (options?.salesRepId) {
    query = query.eq("sales_rep_id", options.salesRepId);
  }
  if (options?.dealershipId) {
    query = query.eq("dealership_id", options.dealershipId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetchPlatformSalesAttributions", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const dealership = row.dealerships as { name?: string } | null;
    const rep = row.platform_sales_reps as { full_name?: string } | null;
    const {
      dealerships: _dealerships,
      platform_sales_reps: _reps,
      ...attribution
    } = row;

    return {
      ...(attribution as PlatformSalesAttributionListRow),
      dealership_name: dealership?.name ?? "—",
      sales_rep_name: rep?.full_name ?? "—",
    };
  });
}

export async function fetchPlatformCommissionLedgerEntries(options?: {
  salesRepId?: string;
  status?: string;
}): Promise<PlatformCommissionLedgerListRow[]> {
  const supabase = getServiceClient();
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("platform_commission_ledger_entries")
    .select(
      "id, sales_rep_id, attribution_id, campaign_id, entry_type, amount_cents, currency, description, reference_month, status, created_at, updated_at, platform_sales_reps(full_name)",
    )
    .order("reference_month", { ascending: false })
    .order("created_at", { ascending: false });

  if (options?.salesRepId) {
    query = query.eq("sales_rep_id", options.salesRepId);
  }
  if (options?.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("fetchPlatformCommissionLedgerEntries", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const rep = row.platform_sales_reps as { full_name?: string } | null;
    const { platform_sales_reps: _reps, ...entry } = row;

    return {
      ...(entry as PlatformCommissionLedgerListRow),
      sales_rep_name: rep?.full_name ?? "—",
    };
  });
}

export async function fetchPlatformIncentiveCampaigns(): Promise<
  PlatformIncentiveCampaignRow[]
> {
  const supabase = getServiceClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("platform_incentive_campaigns")
    .select(
      "id, name, starts_at, ends_at, goal_metric, goal_target, bonus_amount_cents, eligible_rep_ids, status, created_at, updated_at",
    )
    .order("starts_at", { ascending: false });

  if (error) {
    console.error("fetchPlatformIncentiveCampaigns", error.message);
    return [];
  }

  return (data ?? []) as PlatformIncentiveCampaignRow[];
}
