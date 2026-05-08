import "server-only";

import { cache } from "react";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

export interface PlatformFinanceSettings {
  finance_monthly_interest_rate_percent: number;
}

const DEFAULT_MONTHLY_RATE_PERCENT = 1.99;

export const getPlatformFinanceSettings = cache(
  async (): Promise<PlatformFinanceSettings> => {
    let supabase;
    try {
      supabase = createSupabaseServiceRoleClient();
    } catch {
      return { finance_monthly_interest_rate_percent: DEFAULT_MONTHLY_RATE_PERCENT };
    }

    const { data, error } = await supabase
      .from("platform_finance_settings")
      .select("finance_monthly_interest_rate_percent")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return { finance_monthly_interest_rate_percent: DEFAULT_MONTHLY_RATE_PERCENT };
    }

    const parsedRate = Number(data.finance_monthly_interest_rate_percent);
    if (!Number.isFinite(parsedRate) || parsedRate < 0) {
      return { finance_monthly_interest_rate_percent: DEFAULT_MONTHLY_RATE_PERCENT };
    }

    return { finance_monthly_interest_rate_percent: parsedRate };
  },
);
