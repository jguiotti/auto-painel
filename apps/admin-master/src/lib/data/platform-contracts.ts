import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import type {
  PlatformContractRow,
  PlatformContractTemplateRow,
} from "@/lib/data/platform-contracts-shared";

export async function fetchPlatformContractTemplates(): Promise<
  PlatformContractTemplateRow[]
> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }

  const { data, error } = await supabase
    .from("platform_contract_templates")
    .select("id, slug, name, version, body_md, is_active")
    .eq("is_active", true)
    .order("slug", { ascending: true })
    .order("version", { ascending: false });

  if (error) {
    console.error("fetchPlatformContractTemplates", error.message);
    return [];
  }

  return (data ?? []) as PlatformContractTemplateRow[];
}

export async function fetchPlatformContracts(): Promise<PlatformContractRow[]> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }

  const { data, error } = await supabase
    .from("platform_contracts")
    .select(
      "id, template_id, template_version, saas_prospect_id, dealership_id, counterparty_name, counterparty_email, plan_name, monthly_amount, status, review_notes, body_snapshot_md, signature_provider_ref, sent_for_signature_at, signed_at, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("fetchPlatformContracts", error.message);
    return [];
  }

  return (data ?? []) as PlatformContractRow[];
}

export async function fetchPlatformContractById(
  id: string,
): Promise<PlatformContractRow | null> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return null;
  }

  const { data, error } = await supabase
    .from("platform_contracts")
    .select(
      "id, template_id, template_version, saas_prospect_id, dealership_id, counterparty_name, counterparty_email, plan_name, monthly_amount, status, review_notes, body_snapshot_md, signature_provider_ref, sent_for_signature_at, signed_at, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as PlatformContractRow;
}
