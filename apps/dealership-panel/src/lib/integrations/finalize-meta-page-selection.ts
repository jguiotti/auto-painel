import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { decryptTextWithSecret, encryptTextWithSecret } from "@/lib/crypto/aes-gcm-text-secret";

interface MetaPageCandidate {
  page_id: string;
  page_name: string;
  instagram_business_account_id: string | null;
  instagram_username: string | null;
}

function resolveMetaTokensCryptoSecret(): string {
  const secret = process.env.META_TOKENS_CRYPTO_SECRET?.trim();
  if (!secret) {
    throw new Error("META_TOKENS_CRYPTO_SECRET não configurado no servidor.");
  }
  return secret;
}

function resolveGraphVersion(): string {
  return process.env.META_GRAPH_API_VERSION?.trim() || "21.0";
}

async function fetchPageAccessToken(params: {
  pageId: string;
  userAccessToken: string;
  graphVersion: string;
}): Promise<string> {
  const url =
    `https://graph.facebook.com/v${params.graphVersion}/${encodeURIComponent(params.pageId)}` +
    `?fields=access_token&access_token=${encodeURIComponent(params.userAccessToken)}`;
  const response = await fetch(url, { cache: "no-store" });
  const payload = (await response.json()) as {
    access_token?: string;
    error?: { message?: string };
  };
  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error?.message ??
        "Não foi possível obter o token da página selecionada. Tente reconectar.",
    );
  }
  return payload.access_token;
}

export async function finalizeMetaPageSelectionForDealership(params: {
  dealershipId: string;
  pageId: string;
}): Promise<{
  pageName: string | null;
  instagramUsername: string | null;
}> {
  const admin = createSupabaseServiceRoleClient();
  const cryptoSecret = resolveMetaTokensCryptoSecret();
  const graphVersion = resolveGraphVersion();

  const { data: connection, error: connectionError } = await admin
    .from("dealership_meta_connections")
    .select("id, status, pending_page_candidates, token_expires_at")
    .eq("dealership_id", params.dealershipId)
    .maybeSingle();

  if (connectionError || !connection) {
    throw new Error("Conexão Meta não encontrada.");
  }
  if (connection.status !== "page_selection_required") {
    throw new Error("Não há seleção de página pendente.");
  }

  const candidates = Array.isArray(connection.pending_page_candidates)
    ? (connection.pending_page_candidates as MetaPageCandidate[])
    : [];
  const selected = candidates.find((entry) => entry.page_id === params.pageId);
  if (!selected) {
    throw new Error("Página selecionada não está entre as opções disponíveis.");
  }

  const { data: credential, error: credentialError } = await admin
    .from("dealership_meta_credentials")
    .select("user_access_token_encrypted")
    .eq("connection_id", connection.id)
    .maybeSingle();

  if (credentialError || !credential?.user_access_token_encrypted) {
    throw new Error("Token de usuário Meta ausente. Reconecte a conta.");
  }

  const userAccessToken = await decryptTextWithSecret(
    credential.user_access_token_encrypted,
    cryptoSecret,
  );
  const pageAccessToken = await fetchPageAccessToken({
    pageId: selected.page_id,
    userAccessToken,
    graphVersion,
  });

  const pageTokenEncrypted = await encryptTextWithSecret(pageAccessToken, cryptoSecret);

  const { error: credentialsUpdateError } = await admin
    .from("dealership_meta_credentials")
    .update({
      page_access_token_encrypted: pageTokenEncrypted,
      updated_at: new Date().toISOString(),
    })
    .eq("connection_id", connection.id);

  if (credentialsUpdateError) {
    throw new Error(credentialsUpdateError.message);
  }

  const { error: connectionUpdateError } = await admin
    .from("dealership_meta_connections")
    .update({
      status: "connected",
      page_id: selected.page_id,
      page_name: selected.page_name,
      instagram_business_account_id: selected.instagram_business_account_id,
      instagram_username: selected.instagram_username,
      pending_page_candidates: null,
      connected_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", connection.id);

  if (connectionUpdateError) {
    throw new Error(connectionUpdateError.message);
  }

  return {
    pageName: selected.page_name,
    instagramUsername: selected.instagram_username,
  };
}
