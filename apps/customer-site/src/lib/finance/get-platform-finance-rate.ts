import "server-only";

import { cache } from "react";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const DEFAULT_MONTHLY_INTEREST_RATE_PERCENT = 1.99;

export const getPlatformFinanceMonthlyRatePercent = cache(async (): Promise<number> => {
  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return DEFAULT_MONTHLY_INTEREST_RATE_PERCENT;
  }

  const { data, error } = await supabase
    .from("platform_finance_settings")
    .select("finance_monthly_interest_rate_percent")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return DEFAULT_MONTHLY_INTEREST_RATE_PERCENT;
  }

  const parsedRate = Number(data.finance_monthly_interest_rate_percent);
  if (!Number.isFinite(parsedRate) || parsedRate < 0) {
    return DEFAULT_MONTHLY_INTEREST_RATE_PERCENT;
  }

  return parsedRate;
});
