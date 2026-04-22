/**
 * Paths where we must resolve the dealership from the host or redirect to the
 * dealership-not-found page when resolution fails.
 */
export function pathRequiresDealershipResolution(pathname: string): boolean {
  if (pathname.startsWith("/erro")) {
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

  return true;
}
