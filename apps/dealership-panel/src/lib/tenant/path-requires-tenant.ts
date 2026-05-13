import { isDealershipPanelSlugBootstrapEnabled } from "@autopainel/shared/lib/tenant/is-dealership-panel-slug-bootstrap-enabled";

/**
 * Paths where we must resolve the dealership from the host or redirect to the
 * dealership-not-found page when resolution fails.
 */
export function pathRequiresDealershipResolution(pathname: string): boolean {
  if (pathname.startsWith("/erro")) {
    return false;
  }
  if (pathname.startsWith("/conta-inativa")) {
    return false;
  }
  if (pathname.startsWith("/_next")) {
    return false;
  }
  if (pathname === "/favicon.ico") {
    return false;
  }
  if (/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/i.test(pathname)) {
    return false;
  }

  /** Auth flows run before tenant binding; production tenant comes from canonical host only. */
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/recuperar-senha") ||
    pathname.startsWith("/definir-senha") ||
    pathname.startsWith("/auth/")
  ) {
    return false;
  }

  if (
    pathname.startsWith("/painel/acesso") &&
    isDealershipPanelSlugBootstrapEnabled()
  ) {
    return false;
  }

  return true;
}
