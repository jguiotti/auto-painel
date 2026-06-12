import "server-only";

import { decryptClassifiedsSecretValue } from "@autopainel/shared/lib/classifieds-token-crypto";
import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { ClassifiedsOAuthNotConfiguredError } from "@/lib/classifieds/oauth-not-configured-error";

export interface WebMotorsPlatformConfig {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
}

function requireEnvVar(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }
  return value;
}

function resolveEnvWebMotorsConfig(): WebMotorsPlatformConfig | null {
  const clientId = process.env.WEBMOTORS_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.WEBMOTORS_OAUTH_CLIENT_SECRET?.trim();
  const tokenUrl = process.env.WEBMOTORS_OAUTH_TOKEN_URL?.trim();
  if (!clientId || !clientSecret || !tokenUrl) {
    return null;
  }
  return { tokenUrl, clientId, clientSecret };
}

export async function resolveWebMotorsPlatformConfig(): Promise<WebMotorsPlatformConfig> {
  const envConfig = resolveEnvWebMotorsConfig();
  let admin;
  try {
    admin = createSupabaseServiceRoleClient();
  } catch {
    if (envConfig) {
      return envConfig;
    }
    throw new ClassifiedsOAuthNotConfiguredError("webmotors");
  }

  const { data, error } = await admin
    .from("platform_classifieds_oauth_providers")
    .select(
      "is_enabled, token_url, oauth_client_id, oauth_client_secret_encrypted",
    )
    .eq("provider", "webmotors")
    .maybeSingle();

  if (
    error ||
    !data?.is_enabled ||
    !data.token_url?.trim() ||
    !data.oauth_client_id?.trim() ||
    !data.oauth_client_secret_encrypted?.trim()
  ) {
    if (envConfig) {
      return envConfig;
    }
    throw new ClassifiedsOAuthNotConfiguredError("webmotors");
  }

  const cryptoSecret = requireEnvVar("CLASSIFIEDS_TOKENS_CRYPTO_SECRET");
  const clientSecret = await decryptClassifiedsSecretValue(
    data.oauth_client_secret_encrypted,
    cryptoSecret,
  );

  return {
    tokenUrl: data.token_url.trim(),
    clientId: data.oauth_client_id.trim(),
    clientSecret,
  };
}

export async function tryResolveWebMotorsPlatformConfig(): Promise<WebMotorsPlatformConfig | null> {
  try {
    return await resolveWebMotorsPlatformConfig();
  } catch (error) {
    if (error instanceof ClassifiedsOAuthNotConfiguredError) {
      return null;
    }
    return null;
  }
}
