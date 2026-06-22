import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { TRIAL_LIMITED_SPOTS } from "@/lib/legal/trial-constants";

export interface TrialCampaignAvailability {
  limitedSpots: number;
  claimedSpots: number;
  remainingSpots: number;
  acceptsImmediateTrial: boolean;
}

const ACTIVE_INTAKE_STATUSES = ["submitted", "linked", "converted"] as const;

export async function fetchTrialCampaignAvailability(): Promise<TrialCampaignAvailability> {
  const limitedSpots = TRIAL_LIMITED_SPOTS;
  let claimedSpots = 0;

  try {
    const supabase = createSupabaseServiceRoleClient();
    const { count, error } = await supabase
      .from("dealership_onboarding_intakes")
      .select("*", { count: "exact", head: true })
      .in("status", [...ACTIVE_INTAKE_STATUSES]);

    if (!error && typeof count === "number") {
      claimedSpots = count;
    }
  } catch {
    // Service role may be unset in local dev — show campaign copy without live count.
  }

  const remainingSpots = Math.max(0, limitedSpots - claimedSpots);

  return {
    limitedSpots,
    claimedSpots,
    remainingSpots,
    acceptsImmediateTrial: remainingSpots > 0,
  };
}
