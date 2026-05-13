import { ExternalLink } from "lucide-react";

import {
  buildDealershipSubdomainSurfaceUrls,
  buildLocalhostDealershipPreviewUrls,
} from "@autopainel/shared/lib/tenant/dealership-subdomain-surface-urls";
import { isDealershipPanelSlugBootstrapEnabled } from "@autopainel/shared/lib/tenant/is-dealership-panel-slug-bootstrap-enabled";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@autopainel/shared/ui";

interface DealershipOperatorSurfaceLinksProps {
  slug: string;
}

/**
 * Operator-only shortcuts (Admin Master). Isolation stays on Host/cookie + Supabase RLS.
 */
export function DealershipOperatorSurfaceLinks({
  slug,
}: DealershipOperatorSurfaceLinksProps) {
  const trimmed = slug.trim();
  const canonical = trimmed ? buildDealershipSubdomainSurfaceUrls(trimmed) : null;
  const localPreview =
    process.env.NODE_ENV === "development"
      ? buildLocalhostDealershipPreviewUrls(trimmed)
      : null;

  const devPrimary =
    process.env.NODE_ENV === "development" && localPreview !== null;

  const panelHref = devPrimary
    ? localPreview!.panelUrl
    : canonical?.panelUrl ?? "";
  const storefrontHref = devPrimary
    ? localPreview!.storefrontUrl
    : canonical?.storefrontUrl ?? "";

  const showProductionReference =
    devPrimary &&
    canonical !== null &&
    (canonical.panelUrl !== localPreview!.panelUrl ||
      canonical.storefrontUrl !== localPreview!.storefrontUrl);

  const panelPort =
    process.env.NEXT_PUBLIC_DEALERSHIP_PANEL_DEV_PORT?.trim() || "3002";
  const bootstrapHref =
    devPrimary && isDealershipPanelSlugBootstrapEnabled()
      ? `http://localhost:${panelPort}/painel/acesso/${encodeURIComponent(trimmed.toLowerCase())}`
      : null;

  if (!panelHref || !storefrontHref) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            Abrir vitrine e painel desta concessionária
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Defina{" "}
            <code className="text-xs">NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN</code> na raiz (
            <code className="text-xs">.env.local</code>) e rode{" "}
            <code className="text-xs">npm run sync:env</code>. Em desenvolvimento local, os botões
            usam também{" "}
            <code className="text-xs">{`http://{slug}.localhost:{porta}`}</code> quando o slug está
            preenchido.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Abrir vitrine e painel desta concessionária
        </CardTitle>
        <p className="text-muted-foreground text-sm">
          {devPrimary ? (
            <>
              Os botões abrem primeiro os endereços locais{" "}
              <span className="font-medium text-foreground">{`*.localhost`}</span> nas portas do
              monorepo — mesmo que{" "}
              <code className="text-xs">NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN</code> já aponte para o
              domínio de produção.
            </>
          ) : (
            <>
              Ligações públicas geradas a partir do slug e de{" "}
              <code className="text-xs">NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN</code> (e templates opcionais).
              Confirme DNS / TLS wildcard antes de partilhar com a loja.
            </>
          )}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="default" size="sm" asChild>
            <a href={panelHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 size-4" aria-hidden />
              Abrir painel da loja
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={storefrontHref} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 size-4" aria-hidden />
              Abrir site público (vitrine)
            </a>
          </Button>
          {bootstrapHref ? (
            <Button variant="ghost" size="sm" asChild>
              <a href={bootstrapHref} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 size-4" aria-hidden />
                Painel (atalho técnico, só dev)
              </a>
            </Button>
          ) : null}
        </div>

        <dl className="text-muted-foreground space-y-2 text-xs">
          <div>
            <dt className="font-medium text-foreground">
              {devPrimary ? "Endereços usados pelos botões (local)" : "Painel"}
            </dt>
            <dd className="break-all font-mono">{panelHref}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">
              {devPrimary ? "Vitrine (local)" : "Vitrine"}
            </dt>
            <dd className="break-all font-mono">{storefrontHref}</dd>
          </div>
          {showProductionReference ? (
            <>
              <div className="border-border mt-2 border-t pt-2">
                <dt className="font-medium text-foreground">
                  Referência após DNS / deploy (produção)
                </dt>
                <dd className="break-all font-mono">{canonical!.panelUrl}</dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Vitrine (produção)</dt>
                <dd className="break-all font-mono">{canonical!.storefrontUrl}</dd>
              </div>
            </>
          ) : null}
        </dl>

        {bootstrapHref ? (
          <p className="text-muted-foreground text-xs">
            O terceiro botão só aparece com{" "}
            <code className="rounded bg-muted px-1">
              NEXT_PUBLIC_ENABLE_DEALERSHIP_PANEL_SLUG_BOOTSTRAP=true
            </code>
            . Uso apenas por equipa técnica em ambiente controlado.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
