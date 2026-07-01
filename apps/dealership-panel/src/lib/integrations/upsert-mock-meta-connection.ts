import "server-only";

import {
  INTEGRATIONS_MOCK_META_PAGE,
  isIntegrationsMockModeEnabled,
} from "@autopainel/shared/lib/integrations-mock-mode";
import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

export async function upsertMockMetaConnection(dealershipId: string): Promise<void> {
  if (!isIntegrationsMockModeEnabled()) {
    throw new Error("Modo mock desativado.");
  }

  const admin = createSupabaseServiceRoleClient();
  const tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const { data: connectionRow, error: connectionError } = await admin
    .from("dealership_meta_connections")
    .upsert(
      {
        dealership_id: dealershipId,
        status: "connected",
        page_id: INTEGRATIONS_MOCK_META_PAGE.pageId,
        page_name: INTEGRATIONS_MOCK_META_PAGE.pageName,
        instagram_business_account_id:
          INTEGRATIONS_MOCK_META_PAGE.instagramBusinessAccountId,
        instagram_username: INTEGRATIONS_MOCK_META_PAGE.instagramUsername,
        pending_page_candidates: null,
        token_expires_at: tokenExpiresAt,
        connected_at: now,
        last_error: null,
      },
      { onConflict: "dealership_id" },
    )
    .select("id")
    .single();

  if (connectionError || !connectionRow) {
    throw new Error(connectionError?.message ?? "Falha ao simular conexão Meta.");
  }

  const { error: credentialsError } = await admin.from("dealership_meta_credentials").upsert(
    {
      connection_id: connectionRow.id,
      dealership_id: dealershipId,
      user_access_token_encrypted: "integrations_mock:user",
      page_access_token_encrypted: "integrations_mock:page",
      expires_at: tokenExpiresAt,
    },
    { onConflict: "connection_id" },
  );

  if (credentialsError) {
    throw new Error(credentialsError.message);
  }
}
