import "server-only";

import { decryptClassifiedsSecretValue } from "@autopainel/shared/lib/classifieds-token-crypto";
import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { ClassifiedsOAuthNotConfiguredError } from "@/lib/classifieds/oauth-not-configured-error";

export interface ICarrosPlatformConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
}

const DEFAULT_ICARROS_TOKEN_URL =
  "https://accounts.icarros.com/auth/realms/icarros/protocol/openid-connect/token";
const DEFAULT_ICARROS_SCOPE = "openid";

function requireEnvVar(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

function resolveEnvICarrosConfig(): ICarrosPlatformConfig | null {
  const clientId = process.env.ICARROS_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.ICARROS_OAUTH_CLIENT_SECRET?.trim();
  const tokenUrl =
    process.env.ICARROS_OAUTH_TOKEN_URL?.trim() || DEFAULT_ICARROS_TOKEN_URL;
  const scope = process.env.ICARROS_OAUTH_SCOPE?.trim() || DEFAULT_ICARROS_SCOPE;
  if (!clientId || !clientSecret) {
    return null;
  }
  return { tokenUrl, clientId, clientSecret, scope };
}

export async function resolveICarrosPlatformConfig(): Promise<ICarrosPlatformConfig> {
  const envConfig = resolveEnvICarrosConfig();
  let admin;
  try {
    admin = createSupabaseServiceRoleClient();
  } catch {
    if (envConfig) {
      return envConfig;
    }
    throw new ClassifiedsOAuthNotConfiguredError("icarros");
  }

  const { data, error } = await admin
    .from("platform_classifieds_oauth_providers")
    .select(
      "is_enabled, token_url, oauth_client_id, oauth_client_secret_encrypted",
    )
    .eq("provider", "icarros")
    .maybeSingle();

  if (
    error ||
    !data?.is_enabled ||
    !data.oauth_client_id?.trim() ||
    !data.oauth_client_secret_encrypted?.trim()
  ) {
    if (envConfig) {
      return envConfig;
    }
    throw new ClassifiedsOAuthNotConfiguredError("icarros");
  }

  const cryptoSecret = requireEnvVar("CLASSIFIEDS_TOKENS_CRYPTO_SECRET");
  const clientSecret = await decryptClassifiedsSecretValue(
    data.oauth_client_secret_encrypted,
    cryptoSecret,
  );

  return {
    tokenUrl: data.token_url?.trim() || DEFAULT_ICARROS_TOKEN_URL,
    clientId: data.oauth_client_id.trim(),
    clientSecret,
    scope: process.env.ICARROS_OAUTH_SCOPE?.trim() || DEFAULT_ICARROS_SCOPE,
  };
}

export async function tryResolveICarrosPlatformConfig(): Promise<ICarrosPlatformConfig | null> {
  try {
    return await resolveICarrosPlatformConfig();
  } catch (error) {
    if (error instanceof ClassifiedsOAuthNotConfiguredError) {
      return null;
    }
    return null;
  }
}
