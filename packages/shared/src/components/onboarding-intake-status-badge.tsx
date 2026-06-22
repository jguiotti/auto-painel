import type { DealershipOnboardingIntakeStatus } from "../types/dealership-onboarding-intake";
import { Badge, type BadgeProps } from "../ui/badge";

const STATUS_LABELS: Record<DealershipOnboardingIntakeStatus, string> = {
  submitted: "Recebido",
  linked: "Vinculado ao lead",
  converted: "Convertido",
  archived: "Arquivado",
};

const STATUS_VARIANTS: Record<
  DealershipOnboardingIntakeStatus,
  NonNullable<BadgeProps["variant"]>
> = {
  submitted: "secondary",
  linked: "default",
  converted: "outline",
  archived: "secondary",
};

export interface OnboardingIntakeStatusBadgeProps {
  status: DealershipOnboardingIntakeStatus | string;
  className?: string;
}

export function OnboardingIntakeStatusBadge({
  status,
  className,
}: OnboardingIntakeStatusBadgeProps) {
  const normalized = status as DealershipOnboardingIntakeStatus;
  const label = STATUS_LABELS[normalized] ?? status;
  const variant = STATUS_VARIANTS[normalized] ?? "secondary";

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
