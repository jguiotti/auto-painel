import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";

export type AuthEmailLinkType = "invite" | "recovery";

/** Supabase redirect URL allowlist matches path only — no query string. */
export function buildAuthEmailRedirectTo(origin: string): string {
  return `${origin.replace(/\/$/, "")}/auth/confirm`;
}

function parseSupabaseVerifyLink(actionLink: string): {
  hashedToken: string | null;
  verificationType: string | null;
  redirectTo: string | null;
} {
  try {
    const url = new URL(actionLink.trim());
    return {
      hashedToken:
        url.searchParams.get("token_hash") ??
        url.searchParams.get("token") ??
        null,
      verificationType: url.searchParams.get("type"),
      redirectTo: url.searchParams.get("redirect_to"),
    };
  } catch {
    return { hashedToken: null, verificationType: null, redirectTo: null };
  }
}

function normalizeEmailOtpType(raw: string | null): EmailOtpType | null {
  const type = raw?.trim().toLowerCase();
  if (!type) {
    return null;
  }
  if (
    type === "invite" ||
    type === "recovery" ||
    type === "signup" ||
    type === "magiclink" ||
    type === "email" ||
    type === "email_change"
  ) {
    return type as EmailOtpType;
  }
  return null;
}

export function sanitizeAuthNextPath(raw: string | null, fallback: string): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) {
    return raw;
  }
  return fallback;
}

export function buildAuthConfirmUrlFromGenerateLinkResponse(params: {
  redirectTo: string;
  hashedToken?: string | null;
  verificationType?: string | null;
  fallbackActionLink?: string | null;
  motivo?: "primeiro-acesso" | "recuperacao";
}): string | null {
  const hashed = params.hashedToken?.trim();
  const type = params.verificationType?.trim();

  if (hashed && type) {
    let redirectUrl: URL;
    try {
      redirectUrl = new URL(params.redirectTo.trim());
    } catch {
      return params.fallbackActionLink?.trim() ?? null;
    }

    const next = sanitizeAuthNextPath(
      redirectUrl.searchParams.get("next"),
      "/definir-senha",
    );
    const confirmUrl = new URL(
      redirectUrl.pathname || "/auth/confirm",
      redirectUrl.origin,
    );
    confirmUrl.searchParams.set("token_hash", hashed);
    confirmUrl.searchParams.set("type", type);
    confirmUrl.searchParams.set("next", next);

    if (params.motivo) {
      confirmUrl.searchParams.set("motivo", params.motivo);
    } else if (type === "invite") {
      confirmUrl.searchParams.set("motivo", "primeiro-acesso");
    } else if (type === "recovery") {
      confirmUrl.searchParams.set("motivo", "recuperacao");
    }

    return confirmUrl.toString();
  }

  const fallback = params.fallbackActionLink?.trim();
  if (fallback) {
    const parsed = parseSupabaseVerifyLink(fallback);
    if (parsed.hashedToken && parsed.verificationType) {
      const redirectBase = parsed.redirectTo?.trim() || params.redirectTo.trim();
      return buildAuthConfirmUrlFromGenerateLinkResponse({
        redirectTo: redirectBase,
        hashedToken: parsed.hashedToken,
        verificationType: parsed.verificationType,
        motivo: params.motivo,
      });
    }
    return fallback;
  }

  return null;
}

export async function establishSessionFromAuthCallback(
  supabase: SupabaseClient,
  params: {
    code: string | null;
    tokenHash: string | null;
    otpType: string | null;
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }

  if (params.tokenHash && params.otpType) {
    const otpType = normalizeEmailOtpType(params.otpType);
    if (!otpType) {
      return { ok: false, message: "Tipo de link de acesso inválido." };
    }

    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: params.tokenHash,
    });
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }

  return { ok: false, message: "Link de acesso inválido ou incompleto." };
}
