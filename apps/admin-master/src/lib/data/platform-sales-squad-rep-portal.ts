import "server-only";

import { fetchCurrentPlatformSalesRepId } from "@/lib/auth/fetch-current-sales-rep-id";
import {
  fetchPlatformSalesAttributions,
  fetchPlatformSalesRepBankAccounts,
  fetchPlatformSalesRepById,
} from "@/lib/data/platform-sales-squad";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  PlatformSalesRepBankAccountRecord,
  PlatformSalesRepRecord,
} from "@autopainel/shared/types";
import type { PlatformCommissionLedgerListRow } from "@/lib/data/platform-sales-squad-shared";

export async function fetchOwnSalesRepRecord(): Promise<PlatformSalesRepRecord | null> {
  const salesRepId = await fetchCurrentPlatformSalesRepId();
  if (!salesRepId) {
    return null;
  }
  return fetchPlatformSalesRepById(salesRepId);
}

export async function fetchOwnSalesRepBankAccounts(): Promise<
  PlatformSalesRepBankAccountRecord[]
> {
  const salesRepId = await fetchCurrentPlatformSalesRepId();
  if (!salesRepId) {
    return [];
  }
  return fetchPlatformSalesRepBankAccounts(salesRepId);
}

export async function fetchOwnSalesRepAttributions() {
  const salesRepId = await fetchCurrentPlatformSalesRepId();
  if (!salesRepId) {
    return [];
  }
  return fetchPlatformSalesAttributions({ salesRepId });
}

export async function fetchOwnCommissionLedgerEntries(): Promise<
  PlatformCommissionLedgerListRow[]
> {
  const salesRepId = await fetchCurrentPlatformSalesRepId();
  if (!salesRepId) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("platform_commission_ledger_entries")
    .select(
      "id, sales_rep_id, attribution_id, campaign_id, entry_type, amount_cents, currency, description, reference_month, status, created_at, updated_at",
    )
    .eq("sales_rep_id", salesRepId)
    .order("reference_month", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchOwnCommissionLedgerEntries", error.message);
    return [];
  }

  const rep = await fetchPlatformSalesRepById(salesRepId);

  return (data ?? []).map((row) => ({
    ...(row as PlatformCommissionLedgerListRow),
    sales_rep_name: rep?.full_name ?? "—",
  }));
}
