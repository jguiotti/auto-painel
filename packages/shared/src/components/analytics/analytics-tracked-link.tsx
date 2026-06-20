"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

import { pushAutopainelAnalyticsEvent } from "../../lib/analytics/push-autopainel-analytics-event";

interface AnalyticsTrackedLinkProps extends ComponentProps<typeof Link> {
  apEvent: string;
  apEventCategory?: string;
  apEventLabel: string;
}

export function AnalyticsTrackedLink({
  apEvent,
  apEventCategory = "engagement",
  apEventLabel,
  onClick,
  ...props
}: AnalyticsTrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        pushAutopainelAnalyticsEvent({
          ap_event: apEvent,
          ap_event_category: apEventCategory,
          ap_event_label: apEventLabel,
        });
        onClick?.(event);
      }}
    />
  );
}
