import { PlatformCommercialLeadsTable } from "@/components/platform-commercial-leads-table";
import { fetchPlatformCommercialLeads } from "@/lib/data/platform-commercial-leads";
import {
  PLATFORM_LEAD_PIPELINE_LABELS,
  PLATFORM_LEAD_PIPELINE_STATUSES,
} from "@/lib/data/platform-commercial-leads-shared";

export const dynamic = "force-dynamic";

export default async function LeadsComerciaisPage() {
  const rows = await fetchPlatformCommercialLeads();

  const counts = PLATFORM_LEAD_PIPELINE_STATUSES.reduce(
    (acc, status) => {
      acc[status] = rows.filter((row) => row.pipeline_status === status).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  const openCount =
    counts.new +
    counts.qualification +
    counts.demo_scheduled +
    counts.demo_done +
    counts.proposal_sent +
    counts.negotiation;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads comerciais</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pipeline B2B de concessionárias — origem marketing-site e cadastros manuais futuros.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Em aberto</p>
          <p className="text-2xl font-semibold">{openCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Ganhos / onboarding</p>
          <p className="text-2xl font-semibold">{counts.won + counts.onboarding}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Perdidos</p>
          <p className="text-2xl font-semibold">{counts.lost}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {PLATFORM_LEAD_PIPELINE_STATUSES.map((status) => (
          <span key={status} className="rounded-full border px-2 py-0.5">
            {PLATFORM_LEAD_PIPELINE_LABELS[status]}: {counts[status]}
          </span>
        ))}
      </div>

      <PlatformCommercialLeadsTable rows={rows} />
    </div>
  );
}
