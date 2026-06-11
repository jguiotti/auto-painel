/**
 * Optional modules toggled per dealership (`dealerships.enabled_features`).
 * Empty array = legacy behaviour (all optional modules treated as enabled).
 */
export const DEALERSHIP_OPTIONAL_FEATURES = [
  { key: "finance_simulator", label: "Simulador de financiamento" },
  { key: "qr_generator", label: "Gerador de QR Code" },
  { key: "advanced_metrics", label: "Métricas avançadas" },
  { key: "olx_sync", label: "Integração OLX" },
  { key: "webmotors_sync", label: "Integração WebMotors" },
  { key: "icarros_sync", label: "Integração iCarros" },
  { key: "social_media_kit", label: "Kit de redes sociais (Meta)" },
  { key: "recibo_compra", label: "Recibo de compra/venda" },
] as const;

/** SaaS module key per classifieds portal (provider slug). */
export const CLASSIFIEDS_PROVIDER_MODULE_KEYS = {
  olx: "olx_sync",
  webmotors: "webmotors_sync",
  icarros: "icarros_sync",
} as const;

export type ClassifiedsProvider = keyof typeof CLASSIFIEDS_PROVIDER_MODULE_KEYS;

export function isClassifiedsProviderModuleEnabled(
  resolvedKeys: string[] | null | undefined,
  provider: ClassifiedsProvider,
): boolean {
  if (!resolvedKeys || resolvedKeys.length === 0) {
    return false;
  }
  return resolvedKeys.includes(CLASSIFIEDS_PROVIDER_MODULE_KEYS[provider]);
}

export function getEnabledClassifiedsProviders(
  resolvedKeys: string[] | null | undefined,
): ClassifiedsProvider[] {
  return (Object.keys(CLASSIFIEDS_PROVIDER_MODULE_KEYS) as ClassifiedsProvider[]).filter(
    (provider) => isClassifiedsProviderModuleEnabled(resolvedKeys, provider),
  );
}

export function isAnyClassifiedsModuleEnabled(
  resolvedKeys: string[] | null | undefined,
): boolean {
  return getEnabledClassifiedsProviders(resolvedKeys).length > 0;
}

/** Canonical SaaS module key for sale receipt gating. */
export const SALE_RECEIPT_MODULE_KEY = "recibo_compra" as const;

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

/** True when plan includes recibo de compra/venda (`recibo_compra`). */
export function isSaleReceiptModuleEnabled(
  resolvedKeys: string[] | null | undefined,
): boolean {
  return isDealershipFeatureEnabled(resolvedKeys, SALE_RECEIPT_MODULE_KEY);
}
