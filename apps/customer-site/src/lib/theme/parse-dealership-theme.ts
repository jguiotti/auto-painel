export interface DealershipThemeSettings {
  primary?: string;
  accent?: string;
  background?: string;
  foreground?: string;
  surface?: string;
}

export function parseDealershipTheme(
  raw: unknown,
): Required<
  Pick<
    DealershipThemeSettings,
    "primary" | "accent" | "background" | "foreground" | "surface"
  >
> {
  const defaults = {
    primary: "#18181b",
    accent: "#0d9488",
    background: "#fafafa",
    foreground: "#171717",
    surface: "#ffffff",
  };

  if (!raw || typeof raw !== "object") {
    return defaults;
  }

  const t = raw as Record<string, unknown>;

  const readColor = (key: string, fallback: string): string => {
    const v = t[key];
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : fallback;
  };

  return {
    primary: readColor("primary", defaults.primary),
    accent: readColor("accent", defaults.accent),
    background: readColor("background", defaults.background),
    foreground: readColor("foreground", defaults.foreground),
    surface: readColor("surface", defaults.surface),
  };
}
