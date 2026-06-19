import { Badge } from "@autopainel/shared/ui";
import {
  LEGACY_LEAD_STATUS_CONTACTED,
  LEAD_PIPELINE_STATUS_LABELS,
  type LeadPipelineStatus,
} from "@autopainel/shared/types/lead-crm";

const STATUS_VARIANT: Record<
  LeadPipelineStatus,
  "default" | "secondary" | "outline"
> = {
  new: "secondary",
  in_progress: "outline",
  hot: "default",
  cold: "outline",
  won: "default",
  lost: "outline",
};

const STATUS_CLASS: Partial<Record<LeadPipelineStatus, string>> = {
  lost: "border-destructive/50 text-destructive",
  cold: "border-muted-foreground/40 text-muted-foreground",
};

function normalizeLeadStatus(status: string): LeadPipelineStatus | null {
  if (status === LEGACY_LEAD_STATUS_CONTACTED) {
    return "in_progress";
  }
  if (status in LEAD_PIPELINE_STATUS_LABELS) {
    return status as LeadPipelineStatus;
  }
  return null;
}

interface LeadStatusBadgeProps {
  status: string;
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const key = normalizeLeadStatus(status);
  const label = key ? LEAD_PIPELINE_STATUS_LABELS[key] : status;

  return (
    <Badge
      variant={key ? (STATUS_VARIANT[key] ?? "secondary") : "secondary"}
      className={`whitespace-nowrap ${key ? (STATUS_CLASS[key] ?? "") : ""}`}
    >
      {label}
    </Badge>
  );
}
