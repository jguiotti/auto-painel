import type { AutopainelGtmDataLayerContext } from "../../lib/analytics/gtm-types";

interface GoogleTagManagerDataLayerBootstrapProps {
  context: AutopainelGtmDataLayerContext;
}

function serializeDataLayerContext(
  context: AutopainelGtmDataLayerContext,
): string {
  return JSON.stringify(context).replace(/</g, "\\u003c");
}

/** Pushes platform context before gtm.js loads (server-rendered inline script). */
export function GoogleTagManagerDataLayerBootstrap({
  context,
}: GoogleTagManagerDataLayerBootstrapProps) {
  const payload = serializeDataLayerContext(context);

  return (
    <script
      id="autopainel-gtm-data-layer"
      dangerouslySetInnerHTML={{
        __html: `window.dataLayer=window.dataLayer||[];window.dataLayer.push(${payload});`,
      }}
    />
  );
}

interface GoogleTagManagerHeadProps {
  containerId: string;
}

/** Standard GTM snippet — place as high as possible inside `<head>`. */
export function GoogleTagManagerHead({ containerId }: GoogleTagManagerHeadProps) {
  return (
    <script
      id="autopainel-gtm-head"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`,
      }}
    />
  );
}

interface GoogleTagManagerBodyProps {
  containerId: string;
}

/** GTM noscript fallback — place immediately after opening `<body>`. */
export function GoogleTagManagerBody({ containerId }: GoogleTagManagerBodyProps) {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
