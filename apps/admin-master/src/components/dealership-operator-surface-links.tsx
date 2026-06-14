import type { ReactNode } from "react";
import {
  ExternalLink,
  Globe,
  LayoutDashboard,
  Wrench,
} from "lucide-react";

import {
  buildDealershipSubdomainSurfaceUrls,
  buildLocalhostDealershipPreviewUrls,
} from "@autopainel/shared/lib/tenant/dealership-subdomain-surface-urls";
import { isDealershipPanelSlugBootstrapEnabled } from "@autopainel/shared/lib/tenant/is-dealership-panel-slug-bootstrap-enabled";
import { cn } from "@autopainel/shared/lib/utils";

interface DealershipOperatorSurfaceLinksProps {
  slug: string;
}

interface SurfaceLinkCardProps {
  href: string;
  title: string;
  description: string;
  urlLabel: string;
  icon: ReactNode;
  variant?: "primary" | "secondary";
}

function SurfaceLinkCard({
  href,
  title,
  description,
  urlLabel,
  icon,
  variant = "secondary",
}: SurfaceLinkCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex min-h-[8.5rem] flex-col justify-between rounded-xl border p-5 transition-colors",
        variant === "primary"
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            variant === "primary"
              ? "bg-primary-foreground/15 text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {icon}
        </div>
        <ExternalLink
          className={cn(
            "size-4 shrink-0 opacity-60 transition-opacity group-hover:opacity-100",
            variant === "primary" ? "text-primary-foreground" : "text-muted-foreground",
          )}
          aria-hidden
        />
      </div>
      <div className="mt-4 space-y-1">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        <p
          className={cn(
            "text-xs leading-relaxed",
            variant === "primary" ? "text-primary-foreground/80" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
        <p
          className={cn(
            "mt-2 break-all font-mono text-[11px] leading-snug",
            variant === "primary" ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {urlLabel}
        </p>
      </div>
    </a>
  );
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
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground">
          Acesso rápido à loja
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Defina{" "}
          <code className="text-xs">NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN</code> na raiz (
          <code className="text-xs">.env.local</code>) e rode{" "}
          <code className="text-xs">npm run sync:env</code>. Em desenvolvimento local, os
          atalhos usam também{" "}
          <code className="text-xs">{`http://{slug}.localhost:{porta}`}</code> quando o slug
          está preenchido.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">Acesso rápido à loja</h2>
        <p className="text-sm text-muted-foreground">
          {devPrimary
            ? "Abra o painel ou a vitrine no ambiente local. A ordem prioriza validar a sessão no painel antes do site público."
            : "Atalhos gerados a partir do slug e do domínio da plataforma. Confirme DNS e TLS antes de partilhar com a loja."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SurfaceLinkCard
          href={panelHref}
          title="Painel da loja"
          description="Gestão de estoque, contatos, equipe e integrações."
          urlLabel={panelHref}
          icon={<LayoutDashboard className="size-5" aria-hidden />}
          variant="primary"
        />
        <SurfaceLinkCard
          href={storefrontHref}
          title="Site público (vitrine)"
          description="Página que o cliente final vê — estoque, contato e simulação."
          urlLabel={storefrontHref}
          icon={<Globe className="size-5" aria-hidden />}
        />
      </div>

      {bootstrapHref ? (
        <a
          href={bootstrapHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
        >
          <Wrench className="size-3.5 shrink-0" aria-hidden />
          Atalho técnico de painel (somente dev)
          <span className="font-mono">{bootstrapHref}</span>
        </a>
      ) : null}

      {showProductionReference ? (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Referência de produção (após DNS)</p>
          <p className="mt-1 break-all font-mono">Painel: {canonical!.panelUrl}</p>
          <p className="mt-1 break-all font-mono">Vitrine: {canonical!.storefrontUrl}</p>
        </div>
      ) : null}
    </section>
  );
}
