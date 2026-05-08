/**
 * Optional modules toggled per dealership (`dealerships.enabled_features`).
 * Empty array = legacy behaviour (all optional modules treated as enabled).
 */
export const DEALERSHIP_OPTIONAL_FEATURES = [
  { key: "finance_simulator", label: "Simulador de financiamento" },
  { key: "qr_generator", label: "Gerador de QR Code" },
  { key: "advanced_metrics", label: "Métricas avançadas" },
  { key: "classifieds_sync", label: "Integração com classificados" },
  { key: "social_media_kit", label: "Kit de redes sociais (Meta)" },
] as const;

export const LEGACY_OPTIONAL_FEATURE_KEYS: readonly string[] =
  DEALERSHIP_OPTIONAL_FEATURES.map((entry) => entry.key);

export type DealershipOptionalFeatureKey =
  (typeof DEALERSHIP_OPTIONAL_FEATURES)[number]["key"];

export function isDealershipOptionalFeatureEnabled(
  enabledFeatures: string[] | null | undefined,
  featureKey: string,
): boolean {
  if (!enabledFeatures || enabledFeatures.length === 0) {
    return true;
  }
  return enabledFeatures.includes(featureKey);
}

/**
 * Gate UI/actions using keys returned by `effective_feature_keys_for_active_dealership`.
 * Empty array means no optional modules are enabled (unlike legacy raw `enabled_features`).
 */
export function isDealershipFeatureEnabled(
  resolvedKeys: string[] | null | undefined,
  featureKey: DealershipOptionalFeatureKey | string,
): boolean {
  if (!resolvedKeys || resolvedKeys.length === 0) {
    return false;
  }
  return resolvedKeys.includes(featureKey);
}
