/** Marks analytics as excluded for this browser session (internal team traffic). */
export function AnalyticsExclusionBootstrap() {
  return (
    <script
      id="autopainel-analytics-exclusion"
      dangerouslySetInnerHTML={{
        __html: "window.__AP_ANALYTICS_EXCLUDED=true;",
      }}
    />
  );
}
