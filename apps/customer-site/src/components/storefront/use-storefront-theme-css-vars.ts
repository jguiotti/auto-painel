"use client";

import { useMemo } from "react";

import { buildStorefrontCssVariables } from "@autopainel/shared/lib/theme/storefront-css-vars";
import type { CSSProperties } from "react";

import { usePublicDealership } from "@/components/storefront/public-dealership-provider";

/** Theme CSS variables for Radix portals (Sheet/Dialog) that render outside the shell div. */
export function useStorefrontThemeCssVars(): CSSProperties {
  const dealership = usePublicDealership();

  return useMemo(() => {
    if (!dealership) {
      return {};
    }

    return buildStorefrontCssVariables({
      theme_settings: dealership.theme_settings,
      theme_config: dealership.theme_config,
    });
  }, [dealership]);
}
