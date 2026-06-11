/**
 * Social carousel rendering and dealership appearance settings.
 * Tables: `dealership_social_carousel_settings`, `social_publication_jobs`.
 */

export type SocialCarouselArtifactTemplate = "classic" | "performance" | "tech";

export type SocialPublicationJobStatus =
  | "queued"
  | "rendering"
  | "uploading_meta"
  | "published"
  | "failed"
  | "failed_partial";

export type SocialPublicationTriggerSource = "manual_share" | "vehicle_save";

export type SocialPublicationChannel = "instagram_feed" | "facebook_page";

export interface DealershipSocialCarouselSettings {
  dealershipId: string;
  artifactTemplate: SocialCarouselArtifactTemplate;
  watermarkEnabled: boolean;
  integrationsOnboardingDismissedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertDealershipSocialCarouselSettingsArgs {
  p_artifact_template: SocialCarouselArtifactTemplate;
  p_watermark_enabled: boolean;
}

export interface SocialCarouselRenderRequest {
  jobId?: string;
  dealershipId: string;
  artifactTemplate: SocialCarouselArtifactTemplate;
  payloadSnapshot: SocialCarouselPayloadSnapshot;
  previewOnly?: boolean;
  watermarkEnabled?: boolean;
}

export interface SocialCarouselPayloadSnapshot {
  vehicle: {
    id: string;
    brand: string;
    model: string;
    version?: string | null;
    slug?: string | null;
    price?: number | null;
    manufacturing_year?: number | null;
    model_year?: number | null;
    images: string[];
  };
  dealership: {
    name: string;
    slug: string;
    logo_url?: string | null;
    phone?: string | null;
    layout_id?: number | null;
  };
  branding_mask?: boolean;
}

export interface SocialCarouselRenderResult {
  slideUrls: string[];
  slideCount: number;
  includesCtaSlide: boolean;
}

export interface SocialPublicationJobSummary {
  id: string;
  vehicleId: string;
  channels: SocialPublicationChannel[];
  status: SocialPublicationJobStatus;
  artifactTemplate: SocialCarouselArtifactTemplate;
  triggerSource: SocialPublicationTriggerSource;
  errorChannel: string | null;
  errorDetail: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnqueueVehicleSocialShareRequest {
  vehicleId: string;
  channels: SocialPublicationChannel[];
  triggerSource?: SocialPublicationTriggerSource;
}
