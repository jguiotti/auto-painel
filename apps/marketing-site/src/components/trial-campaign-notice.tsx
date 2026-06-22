import {
  trialCampaignAvailabilityDetail,
  trialCampaignAvailabilityHeadline,
} from "@/lib/trial-campaign-copy";
import type { TrialCampaignAvailability } from "@/lib/fetch-trial-campaign-availability";

interface TrialCampaignNoticeProps {
  availability: TrialCampaignAvailability;
}

export function TrialCampaignNotice({ availability }: TrialCampaignNoticeProps) {
  const { remainingSpots } = availability;
  const isWaitlistOnly = remainingSpots <= 0;

  return (
    <div
      className={`rounded-2xl border px-5 py-4 ${
        isWaitlistOnly
          ? "border-amber-500/30 bg-amber-500/10"
          : "border-marketing-accent/30 bg-marketing-accent/5"
      }`}
    >
      <p
        className={`text-sm font-semibold ${
          isWaitlistOnly ? "text-amber-100" : "text-marketing-accent"
        }`}
      >
        {trialCampaignAvailabilityHeadline(remainingSpots)}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">
        {trialCampaignAvailabilityDetail(remainingSpots)}
      </p>
    </div>
  );
}
