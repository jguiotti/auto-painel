"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { ExternalLink, Loader2 } from "lucide-react";

import { formatBrazilMobileMasked, formatCnpjMasked, formatCpfMasked } from "@autopainel/shared/lib/br/format-input-masks";
import { listOnboardingIntakeAssets } from "@autopainel/shared/lib/dealership/list-onboarding-intake-assets";
import { OnboardingIntakeStatusBadge } from "@autopainel/shared/components/onboarding-intake-status-badge";
import type { DealershipOnboardingIntakeRow, StorefrontHomeLayoutKey } from "@autopainel/shared/types";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@autopainel/shared/ui";

import { fetchOnboardingIntakeForReviewAction } from "@/actions/dealership-onboarding-intakes";
import { ContactQuickActions } from "@/components/contact-quick-actions";

interface OnboardingIntakeReviewDialogProps {
  intakeId: string | null;
  summary?: {
    store_name: string;
    slug: string;
    contact_email: string;
    whatsapp: string;
    status: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function buildTrialIntakeFollowUpWhatsAppMessage(params: {
  storeName: string;
  slug: string;
  intakeId: string;
}): string {
  return [
    `Olá! Recebemos sua adesão trial AutoPainel — *${params.storeName}* (${params.slug}).`,
    "",
    "Estamos revisando os dados do formulário antes de ativar sua loja.",
    "Se precisarmos de algum ajuste (logo, banner, textos ou endereço), avisamos por aqui.",
    "",
    `Protocolo: ${params.intakeId}`,
  ].join("\n");
}

function formatAddress(address: Record<string, unknown> | undefined): string {
  if (!address) {
    return "—";
  }
  const parts = [
    address.street,
    address.number,
    address.district,
    address.city,
    address.state,
    address.postal_code,
  ]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="space-y-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[160px_1fr]">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

export function OnboardingIntakeReviewDialog({
  intakeId,
  summary,
  open,
  onOpenChange,
}: OnboardingIntakeReviewDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [row, setRow] = useState<DealershipOnboardingIntakeRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !intakeId) {
      return;
    }

    setError(null);
    setRow(null);
    startTransition(async () => {
      const result = await fetchOnboardingIntakeForReviewAction(intakeId);
      if (result.error || !result.data) {
        setError(result.error ?? "Não foi possível carregar a adesão.");
        return;
      }
      setRow(result.data);
    });
  }, [open, intakeId]);

  const payload = row?.payload;
  const assets = payload ? listOnboardingIntakeAssets(payload) : [];
  const whatsappMessage =
    intakeId && payload
      ? buildTrialIntakeFollowUpWhatsAppMessage({
          storeName: payload.general.store_name,
          slug: payload.general.slug,
          intakeId,
        })
      : null;

  const layoutKey = payload
    ? (String(payload.storefront.layout_id) as StorefrontHomeLayoutKey)
    : null;
  const layoutCopy =
    payload && layoutKey ? payload.storefront.home_copy_by_layout?.[layoutKey] : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 space-y-2 border-b px-6 py-4 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>Revisar adesão trial</DialogTitle>
            {summary ? <OnboardingIntakeStatusBadge status={summary.status} /> : null}
          </div>
          <DialogDescription>
            Confira dados, arquivos e textos antes de converter em concessionária. Protocolo{" "}
            <span className="font-mono text-xs">{intakeId}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4">
          {isPending ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Carregando adesão…
            </div>
          ) : error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : payload ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-foreground">{payload.general.store_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {payload.general.legal_representative_name || "Representante não informado"} ·{" "}
                    {payload.general.contact_email}
                  </p>
                </div>
                <ContactQuickActions
                  email={payload.general.contact_email}
                  phone={payload.general.whatsapp}
                  label={payload.general.store_name}
                  whatsappMessage={whatsappMessage}
                />
              </div>

              <ReviewSection title="Dados gerais">
                <DataRow label="Subdomínio" value={<code>{payload.general.slug}</code>} />
                <DataRow
                  label="CNPJ"
                  value={
                    payload.general.cnpj
                      ? formatCnpjMasked(payload.general.cnpj)
                      : "Não informado"
                  }
                />
                <DataRow
                  label="WhatsApp"
                  value={formatBrazilMobileMasked(payload.general.whatsapp) || "—"}
                />
                <DataRow
                  label="CPF representante"
                  value={
                    payload.general.legal_representative_cpf
                      ? formatCpfMasked(payload.general.legal_representative_cpf)
                      : "—"
                  }
                />
                <DataRow
                  label="Endereço cobrança"
                  value={formatAddress(payload.general.billing_address as Record<string, unknown>)}
                />
                {payload.general.wants_custom_domain ? (
                  <DataRow
                    label="Domínio custom."
                    value={payload.general.custom_domain || "Solicitado — sem domínio informado"}
                  />
                ) : null}
              </ReviewSection>

              <Separator />

              <ReviewSection title="Identidade visual">
                <DataRow label="Cor primária" value={payload.branding.primary_color || "—"} />
                <DataRow
                  label="Texto primária"
                  value={payload.branding.primary_foreground_color || "—"}
                />
                <DataRow label="Cor secundária" value={payload.branding.secondary_color || "—"} />
                <DataRow
                  label="Fontes"
                  value={`${payload.branding.google_font_heading || "padrão"} / ${payload.branding.google_font_body || "padrão"}`}
                />
                {assets.length > 0 ? (
                  <div className="grid gap-4 pt-2 sm:grid-cols-2">
                    {assets.map((asset) => (
                      <div key={asset.key} className="space-y-2 rounded-lg border bg-background p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">{asset.label}</p>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={asset.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-1 size-3.5" />
                              Abrir
                            </a>
                          </Button>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element -- Supabase public URLs */}
                        <img
                          src={asset.url}
                          alt={asset.label}
                          className="max-h-32 w-full rounded-md border object-contain bg-muted/30"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg border border-amber-700/35 bg-amber-100 px-3 py-2 text-sm font-medium text-amber-950">
                    Nenhum logo ou banner foi anexado a esta adesão. Solicite reenvio pelo WhatsApp
                    ou faça upload manual ao converter a loja.
                  </p>
                )}
              </ReviewSection>

              <Separator />

              <ReviewSection title="Vitrine">
                <DataRow
                  label="Layout"
                  value={`Modelo ${payload.storefront.layout_id} · tema ${payload.storefront.theme_mode}`}
                />
                {layoutCopy?.hero_headline ? (
                  <DataRow label="Título hero" value={layoutCopy.hero_headline} />
                ) : null}
                {layoutCopy?.hero_subheadline ? (
                  <DataRow label="Subtítulo hero" value={layoutCopy.hero_subheadline} />
                ) : null}
                {layoutCopy?.heritage_body ? (
                  <DataRow label="Texto institucional (layout)" value={layoutCopy.heritage_body} />
                ) : null}
              </ReviewSection>

              <Separator />

              <ReviewSection title="Institucional">
                <DataRow
                  label="Sobre a loja"
                  value={payload.institutional.about_text || "—"}
                />
                <DataRow label="Instagram" value={payload.institutional.social_instagram || "—"} />
                <DataRow label="Facebook" value={payload.institutional.social_facebook || "—"} />
                <DataRow label="Site" value={payload.institutional.social_website || "—"} />
              </ReviewSection>

              {payload.units?.length ? (
                <>
                  <Separator />
                  <ReviewSection title="Unidades">
                    {payload.units.map((unit, index) => (
                      <div key={`${unit.name}-${index}`} className="rounded-lg border p-3">
                        <p className="font-medium text-foreground">
                          {unit.name || `Unidade ${index + 1}`}
                          {unit.is_primary ? (
                            <Badge variant="secondary" className="ml-2">
                              Matriz
                            </Badge>
                          ) : null}
                        </p>
                        <p className="mt-1 text-sm">
                          WhatsApp: {formatBrazilMobileMasked(unit.whatsapp_number) || "—"}
                        </p>
                        <p className="mt-1 text-sm">
                          {formatAddress(unit.address as Record<string, unknown>)}
                        </p>
                      </div>
                    ))}
                  </ReviewSection>
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4 sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {intakeId && !row?.converted_dealership_id ? (
            <Button type="button" asChild>
              <Link href={`/painel/concessionarias/nova?intake=${intakeId}`}>
                Converter em loja
              </Link>
            </Button>
          ) : row?.converted_dealership_id ? (
            <Button type="button" asChild>
              <Link href={`/painel/concessionarias/${row.converted_dealership_id}/editar`}>
                Abrir loja convertida
              </Link>
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
