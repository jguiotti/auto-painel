import { Badge } from "@autopainel/shared/ui";
import {
  LEAD_PIPELINE_STATUS_LABELS,
  type LeadPipelineStatus,
} from "@autopainel/shared/types/lead-crm";

const STATUS_VARIANT: Record<
  LeadPipelineStatus,
  "default" | "secondary" | "outline"
> = {
  new: "secondary",
  contacted: "outline",
  hot: "default",
  won: "default",
  lost: "outline",
};

const STATUS_CLASS: Partial<Record<LeadPipelineStatus, string>> = {
  lost: "border-destructive/50 text-destructive",
};

interface LeadStatusBadgeProps {
  status: string;
}

export function LeadStatusBadge({ status }: LeadStatusBadgeProps) {
  const key = status as LeadPipelineStatus;
  const label = LEAD_PIPELINE_STATUS_LABELS[key] ?? status;

  return (
    <Badge
      variant={STATUS_VARIANT[key] ?? "secondary"}
      className={`whitespace-nowrap ${STATUS_CLASS[key] ?? ""}`}
    >
      {label}
    </Badge>
  );
}
