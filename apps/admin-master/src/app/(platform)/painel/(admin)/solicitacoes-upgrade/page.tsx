import { requireAdminSession } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UpgradeRequestsPageClient, type UpgradeRequestRow } from "@/components/upgrade-requests-page-client";

export default async function UpgradeRequestsPage() {
  await requireAdminSession();
  const supabase = await createSupabaseServerClient();

  const { data: rows } = await supabase
    .from("dealership_support_requests")
    .select(
      "id, request_type, message, current_plan_slug, desired_plan_slug, status, sla_due_at, created_at, dealerships(name, slug, contact_email, whatsapp_number)",
    )
    .eq("status", "open")
    .order("sla_due_at", { ascending: true })
    .limit(100);

  const mapped: UpgradeRequestRow[] = (rows ?? []).map((row) => {
    const dealershipRaw = Array.isArray(row.dealerships) ? row.dealerships[0] : row.dealerships;
    return {
      id: String(row.id),
      request_type: String(row.request_type),
      message: typeof row.message === "string" ? row.message : null,
      current_plan_slug:
        typeof row.current_plan_slug === "string" ? row.current_plan_slug : null,
      desired_plan_slug:
        typeof row.desired_plan_slug === "string" ? row.desired_plan_slug : null,
      status: String(row.status),
      sla_due_at: String(row.sla_due_at),
      created_at: String(row.created_at),
      dealership:
        dealershipRaw && typeof dealershipRaw === "object"
          ? {
              name: typeof dealershipRaw.name === "string" ? dealershipRaw.name : null,
              slug: typeof dealershipRaw.slug === "string" ? dealershipRaw.slug : null,
              contact_email:
                typeof dealershipRaw.contact_email === "string"
                  ? dealershipRaw.contact_email
                  : null,
              whatsapp_number:
                typeof dealershipRaw.whatsapp_number === "string"
                  ? dealershipRaw.whatsapp_number
                  : null,
            }
          : null,
    };
  });

  return <UpgradeRequestsPageClient rows={mapped} />;
}
