import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicEnv } from "../supabase/env";
import {
  establishSessionFromAuthCallback,
  sanitizeAuthNextPath,
} from "./auth-email-callback";

export interface HandleAuthConfirmRequestOptions {
  defaultNextPath: string;
  loginErrorPath?: string;
}

export async function handleAuthConfirmRequest(
  request: NextRequest,
  options: HandleAuthConfirmRequestOptions,
): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  const motivo = searchParams.get("motivo");
  const safeNext = sanitizeAuthNextPath(
    searchParams.get("next"),
    options.defaultNextPath,
  );

  const loginErrorPath = options.loginErrorPath ?? "/login?erro=confirmacao";

  if (!code && !(tokenHash && otpType)) {
    return NextResponse.redirect(new URL(loginErrorPath, request.url));
  }

  const nextUrl = new URL(safeNext, request.url);
  if (motivo === "primeiro-acesso" || motivo === "recuperacao") {
    nextUrl.searchParams.set("motivo", motivo);
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();
  const response = NextResponse.redirect(nextUrl);

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const result = await establishSessionFromAuthCallback(supabase, {
    code,
    tokenHash,
    otpType,
  });

  if (!result.ok) {
    return NextResponse.redirect(new URL(loginErrorPath, request.url));
  }

  return response;
}
