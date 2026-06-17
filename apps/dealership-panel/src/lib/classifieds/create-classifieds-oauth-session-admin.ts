import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";
import { getSupabaseUrl } from "@autopainel/shared/lib/supabase";

export class ClassifiedsOAuthSessionStoreMismatchError extends Error {
  readonly code = "oauth_session_store_mismatch" as const;

  constructor(public readonly redirectUri: string) {
    super("OAuth callback Supabase project differs from NEXT_PUBLIC_SUPABASE_URL.");
    this.name = "ClassifiedsOAuthSessionStoreMismatchError";
  }
}

export function classifiedsOAuthSessionStoreMismatchMessage(): string {
  return "Para conectar a OLX a partir do localhost, use CLASSIFIEDS_OAUTH_DEV_STUB=true (simulação), aponte NEXT_PUBLIC_SUPABASE_URL para o projeto remoto (wcgevmvystdhqpzwuyig), ou teste no painel publicado em {slug}.loja.autopainel.com.br.";
}

/**
 * OAuth sessions must be stored in the same Supabase project as the Edge callback URL.
 * Dev stub uses a panel-local callback path and matches the local stack.
 */
export function assertClassifiedsOAuthSessionStoreAligned(redirectUri: string): void {
  const redirectHost = new URL(redirectUri).host;
  const appHost = new URL(getSupabaseUrl()).host;

  if (redirectHost !== appHost) {
    throw new ClassifiedsOAuthSessionStoreMismatchError(redirectUri);
  }
}

export function createClassifiedsOAuthSessionAdminClient() {
  return createSupabaseServiceRoleClient();
}
