import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicEnv } from "@autopainel/shared/lib/supabase";

/**
 * Auth email callbacks (recovery / invite) redirect here with ?code=
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next");
  const safeNext =
    nextRaw && nextRaw.startsWith("/") && !nextRaw.startsWith("//")
      ? nextRaw
      : "/painel/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?erro=confirmacao", request.url));
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabasePublicEnv();
  const response = NextResponse.redirect(new URL(safeNext, request.url));

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

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?erro=confirmacao", request.url));
  }

  return response;
}
