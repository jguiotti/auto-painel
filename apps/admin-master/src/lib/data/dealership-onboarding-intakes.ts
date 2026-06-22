import type {
  DealershipOnboardingIntakePayload,
  DealershipOnboardingIntakeRow,
} from "@autopainel/shared/types";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface DealershipOnboardingIntakeListRow {
  id: string;
  status: string;
  store_name: string;
  contact_email: string;
  slug: string;
  saas_prospect_id: string | null;
  converted_dealership_id: string | null;
  created_at: string;
}

function readPayload(row: { payload: unknown }): DealershipOnboardingIntakePayload | null {
  if (!row.payload || typeof row.payload !== "object") {
    return null;
  }
  return row.payload as DealershipOnboardingIntakePayload;
}

export async function fetchDealershipOnboardingIntakes(): Promise<
  DealershipOnboardingIntakeListRow[]
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dealership_onboarding_intakes")
    .select(
      "id, status, payload, saas_prospect_id, converted_dealership_id, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) {
    return [];
  }

  return data.map((row) => {
    const payload = readPayload(row);
    return {
      id: row.id,
      status: row.status,
      store_name: payload?.general?.store_name ?? "—",
      contact_email: payload?.general?.contact_email ?? "—",
      slug: payload?.general?.slug ?? "—",
      saas_prospect_id: row.saas_prospect_id,
      converted_dealership_id: row.converted_dealership_id,
      created_at: row.created_at,
    };
  });
}

export async function fetchOnboardingIntakeIdForProspect(
  saasProspectId: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "get_dealership_onboarding_intake_id_for_prospect",
    { p_saas_prospect_id: saasProspectId },
  );

  if (error || !data) {
    return null;
  }

  return typeof data === "string" ? data : null;
}

export async function fetchDealershipOnboardingIntakeById(
  intakeId: string,
): Promise<DealershipOnboardingIntakeRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("dealership_onboarding_intakes")
    .select("*")
    .eq("id", intakeId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const payload = readPayload(data);
  if (!payload) {
    return null;
  }

  return {
    id: data.id,
    saas_prospect_id: data.saas_prospect_id,
    status: data.status as DealershipOnboardingIntakeRow["status"],
    payload,
    converted_dealership_id: data.converted_dealership_id,
    trial_legal_version: data.trial_legal_version,
    trial_accepted_at: data.trial_accepted_at,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}
