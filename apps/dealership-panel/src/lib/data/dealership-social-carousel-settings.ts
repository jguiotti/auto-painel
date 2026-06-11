import "server-only";

import type { SocialCarouselArtifactTemplate } from "@autopainel/shared/types/social-carousel";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

export interface DealershipSocialCarouselSettingsPublic {
  artifactTemplate: SocialCarouselArtifactTemplate;
  watermarkEnabled: boolean;
  integrationsOnboardingDismissedAt: string | null;
}

export async function getDealershipSocialCarouselSettings(
  dealershipId: string,
): Promise<DealershipSocialCarouselSettingsPublic> {
  const admin = createSupabaseServiceRoleClient();
  const { data } = await admin
    .from("dealership_social_carousel_settings")
    .select("artifact_template, watermark_enabled, integrations_onboarding_dismissed_at")
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (!data) {
    return {
      artifactTemplate: "classic",
      watermarkEnabled: true,
      integrationsOnboardingDismissedAt: null,
    };
  }

  const template = data.artifact_template;
  return {
    artifactTemplate:
      template === "performance" || template === "tech" ? template : "classic",
    watermarkEnabled: data.watermark_enabled !== false,
    integrationsOnboardingDismissedAt:
      data.integrations_onboarding_dismissed_at ?? null,
  };
}

export function artifactTemplateLabel(template: SocialCarouselArtifactTemplate): string {
  if (template === "performance") {
    return "Performance / Bold";
  }
  if (template === "tech") {
    return "Tech / Modern";
  }
  return "Classic / Clean";
}
