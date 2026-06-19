import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import type { PlatformCommercialLeadRow } from "@/lib/data/platform-commercial-leads-shared";

export type {
  PlatformCommercialLeadRow,
  PlatformLeadPipelineStatus,
} from "@/lib/data/platform-commercial-leads-shared";

export {
  PLATFORM_LEAD_PIPELINE_LABELS,
  PLATFORM_LEAD_PIPELINE_STATUSES,
} from "@/lib/data/platform-commercial-leads-shared";

const FULL_SELECT =
  "id, full_name, email, phone, company_name, message, source, pipeline_status, lost_reason_code, lost_reason_note, created_at, updated_at";

const LEGACY_SELECT =
  "id, full_name, email, phone, company_name, message, source, created_at";

function isMissingPipelineColumn(message: string): boolean {
  return message.includes("pipeline_status");
}

function isMissingTable(message: string, table: string): boolean {
  return (
    message.includes("Could not find the table") ||
    message.includes("does not exist") ||
    message.includes(table)
  );
}

export async function fetchPlatformCommercialLeads(): Promise<
  PlatformCommercialLeadRow[]
> {
  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }

  const { data, error } = await supabase
    .from("saas_prospects")
    .select(FULL_SELECT)
    .order("created_at", { ascending: false });

  if (!error) {
    return (data ?? []) as PlatformCommercialLeadRow[];
  }

  if (isMissingPipelineColumn(error.message)) {
    const legacy = await supabase
      .from("saas_prospects")
      .select(LEGACY_SELECT)
      .order("created_at", { ascending: false });

    if (legacy.error) {
      return [];
    }

    return (legacy.data ?? []).map((row) => ({
      ...(row as Omit<PlatformCommercialLeadRow, "pipeline_status" | "lost_reason_code" | "lost_reason_note" | "updated_at">),
      pipeline_status: "new",
      lost_reason_code: null,
      lost_reason_note: null,
      updated_at: (row as { created_at: string }).created_at,
    }));
  }

  return [];
}
