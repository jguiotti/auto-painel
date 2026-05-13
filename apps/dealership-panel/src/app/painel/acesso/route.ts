import { type NextRequest, NextResponse } from "next/server";

import { DEALERSHIP_NOT_FOUND_PATH } from "@/lib/tenant/constants";

/** No public index for tenant bootstrap — avoids hinting slug-guessing endpoints. */
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL(DEALERSHIP_NOT_FOUND_PATH, request.url));
}
