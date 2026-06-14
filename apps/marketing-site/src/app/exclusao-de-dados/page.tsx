import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageLayout } from "@/components/legal-page-layout";
import {
  LEGAL_SITE_URL,
  PRIVACY_EMAIL,
  PRIVACY_POLICY_VERSION,
} from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Exclusão de dados",
  description:
    "Como solicitar a exclusão dos seus dados pessoais tratados pela AutoPainel, conforme LGPD.",
  alternates: { canonical: `${LEGAL_SITE_URL}/exclusao-de-dados` },
  robots: { index: true, follow: true },
};

export default function ExclusaoDeDadosPage() {
  return (
    <LegalPageLayout
      title="Exclusão de dados do usuário"
      description="Instruções para titulares de dados solicitarem exclusão ou anonimização de informações pessoais."
      lastUpdated={PRIVACY_POLICY_VERSION}
    >
      <p>
        Em conformidade com a LGPD e requisitos de plataformas integradas (incluindo Meta), esta
        página explica como solicitar a exclusão de dados pessoais tratados pela AutoPainel no
        contexto do site institucional e relacionamento comercial.
      </p>

      <h2>1. Quem pode solicitar</h2>
      <ul>
        <li>Titular dos dados pessoais (pessoa natural identificada ou identificável).</li>
        <li>Representante legal devidamente comprovado.</li>
        <li>Responsável por concessionária cliente, para dados de usuários vinculados ao contrato
          (mediante comprovação de autorização).</li>
      </ul>

      <h2>2. Como solicitar</h2>
      <p>Envie e-mail para:</p>
      <p>
        <a href={`mailto:${PRIVACY_EMAIL}`} className="text-marketing-accent hover:underline">
          {PRIVACY_EMAIL}
        </a>
      </p>
      <p>Inclua no pedido:</p>
      <ul>
        <li>Nome completo e e-mail utilizado no cadastro ou formulário;</li>
        <li>Descrição clara do que deseja (exclusão, anonimização ou revogação de consentimento);</li>
        <li>Documento de identificação, se necessário para confirmar titularidade.</li>
      </ul>

      <h2>3. Prazo de resposta</h2>
      <p>
        Confirmamos o recebimento em até 2 dias úteis e concluímos a análise em até{" "}
        <strong>15 dias úteis</strong>, prorrogáveis conforme LGPD quando houver complexidade
        justificada.
      </p>

      <h2>4. O que será excluído</h2>
      <ul>
        <li>Dados de prospect comercial (formulário de demonstração), salvo obrigação legal de retenção.</li>
        <li>Preferências de cookies e registros de marketing, quando aplicável.</li>
        <li>Dados de usuários de concessionárias: tratados conforme contrato com a loja contratante;
          podemos orientar o encaminhamento ao administrador da conta quando aplicável.</li>
      </ul>

      <h2>5. O que pode ser mantido</h2>
      <p>
        Podemos reter dados mínimos exigidos por lei (fiscal, contábil, defesa em processos) ou
        registros anonimizados para estatísticas agregadas, sem identificação do titular.
      </p>

      <h2>6. Integrações Meta (Facebook / Instagram)</h2>
      <p>
        Se você conectou uma Página via painel da concessionária, tokens OAuth são gerenciados
        pela loja. Para revogar acesso à app AutoPainel na Meta, use também as configurações de
        apps e sites em sua conta Facebook → Configurações → Business Integrations.
      </p>

      <h2>7. Mais informações</h2>
      <p>
        Consulte a{" "}
        <Link href="/politica-de-privacidade" className="text-marketing-accent hover:underline">
          Política de Privacidade
        </Link>{" "}
        para bases legais, direitos e contato do encarregado.
      </p>
    </LegalPageLayout>
  );
}
