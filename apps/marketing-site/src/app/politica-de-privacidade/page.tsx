import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageLayout } from "@/components/legal-page-layout";
import {
  CONTACT_EMAIL,
  LEGAL_SITE_URL,
  PRIVACY_EMAIL,
  PRIVACY_POLICY_VERSION,
} from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a AutoPainel trata dados pessoais de visitantes, prospects e usuários da plataforma — em conformidade com a LGPD.",
  alternates: { canonical: `${LEGAL_SITE_URL}/politica-de-privacidade` },
  robots: { index: true, follow: true },
};

export default function PoliticaDePrivacidadePage() {
  return (
    <LegalPageLayout
      title="Política de Privacidade"
      description="Transparência sobre coleta, uso e proteção de dados pessoais no site institucional e na plataforma AutoPainel."
      lastUpdated={PRIVACY_POLICY_VERSION}
    >
      <p>
        A <strong>AutoPainel</strong> (“nós”) respeita sua privacidade e trata dados pessoais em
        conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
      </p>

      <h2>1. Quem somos</h2>
      <p>
        AutoPainel é uma plataforma SaaS B2B para concessionárias e revendedoras de veículos,
        disponível em{" "}
        <Link href="/" className="text-marketing-accent hover:underline">
          autopainel.com.br
        </Link>
        .
      </p>
      <p>
        Encarregado de dados (DPO):{" "}
        <a href={`mailto:${PRIVACY_EMAIL}`} className="text-marketing-accent hover:underline">
          {PRIVACY_EMAIL}
        </a>
      </p>

      <h2>2. Dados que coletamos</h2>
      <h3>2.1 Visitantes do site institucional</h3>
      <ul>
        <li>Dados de navegação (IP, páginas visitadas, referrer) — quando houver consentimento para analytics.</li>
        <li>Dados informados voluntariamente em formulários (nome, e-mail, telefone, empresa, mensagem).</li>
        <li>Preferências de cookies armazenadas no seu navegador.</li>
      </ul>
      <h3>2.2 Usuários da plataforma (concessionárias clientes)</h3>
      <p>
        Dados de cadastro, operação de estoque, leads e integrações são tratados conforme contrato
        com a concessionária contratante. Esta política foca no site institucional e captura de
        prospects; clientes da plataforma possuem termos específicos no painel contratual.
      </p>

      <h2>3. Finalidades e bases legais</h2>
      <ul>
        <li>
          <strong>Atendimento comercial</strong> — responder pedidos de demonstração (execução de
          procedimentos preliminares ou consentimento).
        </li>
        <li>
          <strong>Marketing</strong> — envio de novidades e contato comercial, apenas com opt-in
          explícito.
        </li>
        <li>
          <strong>Analytics</strong> — medir desempenho do site, com consentimento via banner de
          cookies.
        </li>
        <li>
          <strong>Segurança e conformidade</strong> — prevenir fraudes e cumprir obrigações legais
          (interesse legítimo ou obrigação legal).
        </li>
      </ul>

      <h2>4. Compartilhamento</h2>
      <p>
        Podemos compartilhar dados com prestadores essenciais (hospedagem, e-mail, analytics),
        sempre sob contratos que exijam proteção adequada. Não vendemos dados pessoais.
      </p>

      <h2>5. Retenção</h2>
      <p>
        Prospects comerciais: enquanto houver relação comercial ou interesse legítimo, respeitando
        prazos legais. Logs de analytics: conforme política de cookies e configuração das
        ferramentas utilizadas.
      </p>

      <h2>6. Seus direitos (LGPD)</h2>
      <p>Você pode solicitar:</p>
      <ul>
        <li>Confirmação e acesso aos dados;</li>
        <li>Correção de dados incompletos ou desatualizados;</li>
        <li>Anonimização, bloqueio ou eliminação de dados desnecessários;</li>
        <li>Revogação de consentimento;</li>
        <li>Informação sobre compartilhamentos.</li>
      </ul>
      <p>
        Envie pedidos para{" "}
        <a href={`mailto:${PRIVACY_EMAIL}`} className="text-marketing-accent hover:underline">
          {PRIVACY_EMAIL}
        </a>
        . Respondemos em até 15 dias úteis, salvo prazos legais específicos.
      </p>

      <h2>7. Cookies</h2>
      <p>
        Utilizamos cookies essenciais e, com seu consentimento, cookies de analytics. Detalhes em{" "}
        <Link href="/politica-de-cookies" className="text-marketing-accent hover:underline">
          Política de Cookies
        </Link>
        .
      </p>

      <h2>8. Exclusão de dados</h2>
      <p>
        Instruções em{" "}
        <Link href="/exclusao-de-dados" className="text-marketing-accent hover:underline">
          Exclusão de dados
        </Link>
        .
      </p>

      <h2>9. Contato</h2>
      <p>
        Privacidade:{" "}
        <a href={`mailto:${PRIVACY_EMAIL}`} className="text-marketing-accent hover:underline">
          {PRIVACY_EMAIL}
        </a>
        <br />
        Comercial:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-marketing-accent hover:underline">
          {CONTACT_EMAIL}
        </a>
      </p>
    </LegalPageLayout>
  );
}
