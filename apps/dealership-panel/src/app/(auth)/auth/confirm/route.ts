import { handleAuthConfirmRequest } from "@autopainel/shared/lib/auth/handle-auth-confirm-request";
import { type NextRequest } from "next/server";

/**
 * Auth email callbacks (invite, recovery) land here with token_hash or PKCE code.
 */
export async function GET(request: NextRequest) {
  return handleAuthConfirmRequest(request, {
    defaultNextPath: "/definir-senha",
  });
}
