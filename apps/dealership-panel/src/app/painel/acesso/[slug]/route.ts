import { createSupabaseAnonClient } from "@autopainel/shared/lib/supabase";
import { isDealershipPanelSlugBootstrapEnabled } from "@autopainel/shared/lib/tenant/is-dealership-panel-slug-bootstrap-enabled";
import { type NextRequest, NextResponse } from "next/server";

import { COOKIE_DEALERSHIP_ID, DEALERSHIP_NOT_FOUND_PATH } from "@/lib/tenant/constants";

const SLUG_SEGMENT_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  if (!isDealershipPanelSlugBootstrapEnabled()) {
    return NextResponse.redirect(
      new URL(DEALERSHIP_NOT_FOUND_PATH, request.url),
    );
  }

  const raw = (await context.params).slug ?? "";
  const slug = decodeURIComponent(raw).trim().toLowerCase();
  if (!slug || !SLUG_SEGMENT_RE.test(slug)) {
    return NextResponse.redirect(new URL(DEALERSHIP_NOT_FOUND_PATH, request.url));
  }

  const supabase = createSupabaseAnonClient();
  const { data, error } = await supabase.rpc(
    "get_dealership_id_by_slug_for_dashboard",
    { p_slug: slug },
  );

  if (error) {
    console.warn("[tenant-path-access] slug RPC failed", {
      slug,
      message: error.message,
      code: error.code,
    });
    return NextResponse.redirect(new URL(DEALERSHIP_NOT_FOUND_PATH, request.url));
  }

  const id = coerceUuid(data);
  if (!id) {
    return NextResponse.redirect(new URL(DEALERSHIP_NOT_FOUND_PATH, request.url));
  }

  const url = request.nextUrl;
  const rawNext = url.searchParams.get("redirectTo");
  const redirectPath =
    rawNext &&
    rawNext.startsWith("/") &&
    !rawNext.startsWith("//")
      ? rawNext
      : "/painel";

  const response = NextResponse.redirect(new URL(redirectPath, request.url));
  response.cookies.set(COOKIE_DEALERSHIP_ID, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

function coerceUuid(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  const s = typeof value === "string" ? value : String(value);
  return s.length > 0 ? s : null;
}
