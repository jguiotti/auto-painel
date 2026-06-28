import type { DealershipOnboardingIntakePayload } from "../../types/dealership-onboarding-intake";

export interface OnboardingIntakeAssetPreview {
  key: string;
  label: string;
  url: string;
}

export function listOnboardingIntakeAssets(
  payload: DealershipOnboardingIntakePayload,
): OnboardingIntakeAssetPreview[] {
  const entries: OnboardingIntakeAssetPreview[] = [
    { key: "logo_dark", label: "Logo fundo claro", url: payload.branding.logo_dark_url },
    { key: "logo_light", label: "Logo fundo escuro", url: payload.branding.logo_light_url },
    { key: "footer_logo", label: "Logo rodapé", url: payload.branding.footer_logo_url },
    { key: "favicon", label: "Favicon", url: payload.branding.favicon_url },
    {
      key: "hero_background",
      label: "Banner da homepage",
      url: payload.storefront.hero_background_url,
    },
  ];

  return entries.filter((entry) => entry.url.trim().length > 0);
}

export function countOnboardingIntakeAssets(payload: DealershipOnboardingIntakePayload): {
  uploaded: number;
  expected: number;
} {
  const expected = 5;
  return {
    uploaded: listOnboardingIntakeAssets(payload).length,
    expected,
  };
}
