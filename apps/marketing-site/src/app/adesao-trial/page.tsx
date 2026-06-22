import type { Metadata } from "next";

import { TrialCampaignNotice } from "@/components/trial-campaign-notice";
import { TrialOnboardingForm } from "@/components/trial-onboarding-form";
import { fetchTrialCampaignAvailability } from "@/lib/fetch-trial-campaign-availability";
import { LEGAL_SITE_URL } from "@/lib/legal/constants";
import { TRIAL_DURATION_DAYS, TRIAL_LIMITED_SPOTS } from "@/lib/legal/trial-constants";
import { TRIAL_CAMPAIGN_SETUP_WAIVER_LINE } from "@/lib/trial-campaign-copy";

export const metadata: Metadata = {
  title: "Adesão trial grátis",
  description: `Trial de ${TRIAL_DURATION_DAYS} dias no plano Essencial — vagas limitadas (${TRIAL_LIMITED_SPOTS} lojistas) com setup isento. Fila de espera disponível.`,
  openGraph: {
    title: "Trial grátis — AutoPainel",
    description: `Monte sua vitrine em minutos. ${TRIAL_DURATION_DAYS} dias no plano Essencial. Vagas limitadas com setup isento.`,
    url: `${LEGAL_SITE_URL}/adesao-trial`,
  },
  alternates: { canonical: `${LEGAL_SITE_URL}/adesao-trial` },
};

export default async function AdesaoTrialPage({
  searchParams,
}: {
  searchParams: Promise<{ saas_prospect_id?: string }>;
}) {
  const params = await searchParams;
  const saasProspectId = params.saas_prospect_id?.trim() || null;
  const availability = await fetchTrialCampaignAvailability();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
      <div className="mb-10 space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-marketing-accent">
            Campanha · Plano Essencial
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Trial grátis por {TRIAL_DURATION_DAYS} dias
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Preencha uma vez: dados da loja, identidade visual e textos da vitrine. Nossa equipe
            converte em loja ativa com Simulador de financiamento, QR Code e Métricas avançadas
            inclusos.
          </p>
          {saasProspectId ? (
            <p className="mt-3 text-sm text-zinc-400">
              Este envio será vinculado ao seu lead comercial existente.
            </p>
          ) : null}
        </div>
        <TrialCampaignNotice availability={availability} />
        {!availability.acceptsImmediateTrial ? (
          <p className="text-sm text-zinc-400">
            Você ainda pode enviar o formulário abaixo para entrar na{" "}
            <strong className="font-medium text-zinc-300">fila de espera</strong>. Quando abrirmos
            novas vagas, entraremos em contato pelo e-mail informado.
          </p>
        ) : (
          <p className="text-sm text-zinc-400">{TRIAL_CAMPAIGN_SETUP_WAIVER_LINE}</p>
        )}
      </div>
      <TrialOnboardingForm
        saasProspectId={saasProspectId}
        acceptsImmediateTrial={availability.acceptsImmediateTrial}
      />
    </div>
  );
}
