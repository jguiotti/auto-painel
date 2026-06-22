import type { Metadata } from "next";
import Link from "next/link";

import { LEGAL_SITE_URL } from "@/lib/legal/constants";
import { TRIAL_DURATION_DAYS, TRIAL_LIMITED_SPOTS } from "@/lib/legal/trial-constants";
import { TRIAL_CAMPAIGN_SETUP_WAIVER_LINE, TRIAL_CAMPAIGN_WAITLIST_LINE } from "@/lib/trial-campaign-copy";

export const metadata: Metadata = {
  title: "Termo de Adesão ao Trial",
  description: `Condições do trial gratuito de ${TRIAL_DURATION_DAYS} dias no plano Essencial AutoPainel.`,
  alternates: { canonical: `${LEGAL_SITE_URL}/termo-adesao-trial` },
};

export default function TermoAdesaoTrialPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 prose prose-invert prose-zinc">
      <h1>Termo de Adesão ao Trial — Plano Essencial AutoPainel</h1>

      <p>
        Este Termo regula a adesão gratuita por <strong>{TRIAL_DURATION_DAYS} (trinta) dias</strong>{" "}
        ao plano <strong>Essencial</strong> da plataforma AutoPainel, operada por{" "}
        <strong>Janaina Guiotti Tecnologia e Produtos Ltda</strong> (CNPJ 47.713.237/0001-83).
      </p>

      <h2>1. Objeto</h2>
      <p>
        Licença temporária e não exclusiva de uso da plataforma SaaS AutoPainel, incluindo vitrine
        whitelabel, painel administrativo, gestão de estoque e leads, e módulos do plano Essencial
        vigente (Simulador de financiamento, Gerador de QR Code e Métricas avançadas), conforme
        catálogo publicado em autopainel.com.br/planos.
      </p>

      <h2>2. Prazo, campanha e conversão</h2>
      <p>
        O trial inicia na data de ativação informada pela AutoPainel e encerra automaticamente após{" "}
        {TRIAL_DURATION_DAYS} dias corridos, salvo contratação do plano pago ou rescisão antecipada.
        Após o trial, a continuidade depende de assinatura do Contrato SaaS e pagamento da
        mensalidade e taxa de setup acordadas.
      </p>
      <p>
        <strong>Campanha promocional:</strong> vagas limitadas aos primeiros{" "}
        <strong>{TRIAL_LIMITED_SPOTS} (vinte) lojistas</strong> interessados na adesão imediata.
        {TRIAL_CAMPAIGN_SETUP_WAIVER_LINE} Demais interessados podem solicitar o trial e integrar a
        fila de espera — a AutoPainel entrará em contato quando abrirem novas vagas.{" "}
        {TRIAL_CAMPAIGN_WAITLIST_LINE}
      </p>

      <h2>3. Dados cadastrais</h2>
      <p>
        A loja declara veracidade dos dados informados no formulário de adesão (CNPJ, representante
        legal, endereço de cobrança, identidade visual e conteúdos da vitrine), responsabilizando-se
        civil e criminalmente por informações falsas.
      </p>

      <h2>4. Proteção de dados (LGPD) — cláusula essencial</h2>
      <p>
        <strong>4.1.</strong> Para os dados pessoais de <strong>consumidores e leads</strong>{" "}
        captados na vitrine da loja (formulários, simulações, WhatsApp, CRM), a{" "}
        <strong>Concessionária é CONTROLADORA</strong> e a <strong>AutoPainel é OPERADORA e
        DETENTORA</strong> dos registros na infraestrutura multitenant, na medida necessária à
        execução do serviço, backup, segurança, analytics contratados e suporte.
      </p>
      <p>
        <strong>4.2.</strong> A loja <strong>aceita expressamente</strong> que a AutoPainel hospede,
        processe, organize e retenha tais dados em servidores sob sua gestão, observadas medidas de
        segurança e instruções da controladora, nos termos do art. 39 da LGPD.
      </p>
      <p>
        <strong>4.3.</strong> A loja deve manter Política de Privacidade própria na vitrine,
        informando titulares sobre o tratamento e canal de contato, e encaminhar solicitações de
        titulares à AutoPainel quando envolver dados operados na plataforma.
      </p>

      <h2>5. Uso aceitável</h2>
      <p>
        É vedado uso ilícito, tentativa de acesso a dados de outras lojas, spam, conteúdo enganoso
        ou violação de direitos de terceiros. A AutoPainel pode suspender o trial por violação grave.
      </p>

      <h2>6. Propriedade intelectual</h2>
      <p>
        A plataforma, código e marcas AutoPainel permanecem da licenciante. Conteúdos e marcas da
        loja permanecem da concessionária.
      </p>

      <h2>7. Limitação</h2>
      <p>
        O trial é fornecido «como está», sem SLA comercial. Integrações marcadas «Em breve» no site
        podem não estar disponíveis durante o trial.
      </p>

      <h2>8. Foro</h2>
      <p>Foro de Mongaguá/SP, com renúncia a qualquer outro.</p>

      <p className="not-prose mt-8">
        <Link href="/adesao-trial" className="text-marketing-accent hover:underline">
          ← Voltar ao formulário de adesão
        </Link>
      </p>
    </article>
  );
}
