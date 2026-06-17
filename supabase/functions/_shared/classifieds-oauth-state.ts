type ClassifiedsProvider = "olx" | "webmotors" | "icarros";

const STATE_PREFIX = "ap";

export function parseProviderFromClassifiedsOAuthState(
  state: string,
): ClassifiedsProvider | null {
  const match = /^ap:(olx|webmotors|icarros):/.exec(state.trim());
  if (!match) {
    return null;
  }
  return match[1] as ClassifiedsProvider;
}
