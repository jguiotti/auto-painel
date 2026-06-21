interface GoogleTagManagerConsentDefaultProps {
  analyticsGranted: boolean;
}

/**
 * Consent Mode v2 defaults before gtm.js. Hotjar/GA4 tags in GTM should respect
 * `analytics_storage` or the DL flag `ap_analytics_consent`.
 */
export function GoogleTagManagerConsentDefault({
  analyticsGranted,
}: GoogleTagManagerConsentDefaultProps) {
  const storage = analyticsGranted ? "granted" : "denied";

  return (
    <script
      id="autopainel-gtm-consent-default"
      dangerouslySetInnerHTML={{
        __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{analytics_storage:'${storage}',ad_storage:'${storage}',ad_user_data:'${storage}',ad_personalization:'${storage}',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});`,
      }}
    />
  );
}
