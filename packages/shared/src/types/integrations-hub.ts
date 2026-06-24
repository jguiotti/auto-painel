/**
 * Integrations hub contracts — Meta OAuth, classifieds connect states, provider block reasons.
 */

export type MetaConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "reauth_required"
  | "page_selection_required";

export interface MetaPageCandidate {
  pageId: string;
  pageName: string;
  instagramBusinessAccountId: string | null;
  instagramUsername: string | null;
}

export interface MetaOAuthPopupMessage {
  source: "autopainel_meta_oauth";
  success: boolean;
  error?: string | null;
  requiresPageSelection?: boolean;
  pageCount?: number;
}

export interface ListDealershipMetaPageCandidatesResult {
  candidates: MetaPageCandidate[];
}

export interface FinalizeMetaPageSelectionRequest {
  pageId: string;
}

export interface FinalizeMetaPageSelectionResult {
  success: boolean;
  connectionStatus: MetaConnectionStatus;
  pageName: string | null;
  instagramUsername: string | null;
  error?: string;
}

export type ClassifiedsProvider = "olx" | "webmotors";

export type ClassifiedsConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "reauth_required";

export type ClassifiedsProviderBlockReason =
  | "module_inactive"
  | "channel_not_configured"
  | "disconnected"
  | "reauth_required"
  | "available";

export interface ClassifiedsProviderAvailabilityEntry {
  provider: ClassifiedsProvider;
  available: boolean;
  connectionStatus: ClassifiedsConnectionStatus | null;
  blockReason: ClassifiedsProviderBlockReason;
}

export type ClassifiedsListingSyncStatus =
  | "pending"
  | "published"
  | "delisted"
  | "error";

export interface VehicleClassifiedListingRow {
  provider: ClassifiedsProvider;
  syncStatus: ClassifiedsListingSyncStatus;
  externalListingId: string | null;
  externalListingUrl: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
}

export interface IntegrationsOnboardingState {
  dismissed: boolean;
  metaConnected: boolean;
  classifiedsConnectedCount: number;
  carouselConfigured: boolean;
}
