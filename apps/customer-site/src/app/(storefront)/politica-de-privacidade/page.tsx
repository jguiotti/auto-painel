import type { Metadata } from "next";
import Link from "next/link";

import { StorefrontLegalPageLayout } from "@/components/storefront/storefront-legal-page-layout";
import {
  PLATFORM_LEGAL_URL,
  PLATFORM_PRIVACY_EMAIL,
  STOREFRONT_LEGAL_VERSION,
} from "@/lib/legal/constants";
import { getDealershipPublicRecord } from "@/lib/tenant/get-dealership-public-record";

export async function generateMetadata(): Promise<Metadata> {
  const dealership = await getDealershipPublicRecord();
  const name = dealership?.name ?? "Concessionária";
  return {
    title: `Política de Privacidade — ${name}`,
    description: `Como ${name} trata seus dados pessoais neste site, em conformidade com a LGPD.`,
  };
}

export default async function PoliticaDePrivacidadePage() {
  const dealership = await getDealershipPublicRecord();
  const storeName = dealership?.name ?? "esta concessionária";
  const storeEmail = dealership?.contact_email;

  return (
    <StorefrontLegalPageLayout
      title="Política de Privacidade"
      description={`Transparência sobre coleta, uso e proteção de dados pessoais no site de ${storeName}.`}
      lastUpdated={STOREFRONT_LEGAL_VERSION}
    >
      <p>
        A <strong>{storeName}</strong> respeita sua privacidade e trata dados pessoais em
        conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
      </p>

      <h2>1. Quem é responsável pelos seus dados</h2>
      <p>
        O controlador dos dados coletados neste site é a <strong>{storeName}</strong>, operadora
        da vitrine digital.
        {storeEmail ? (
          <>
            {" "}
            Para assuntos de privacidade desta loja:{" "}
            <a href={`mailto:${storeEmail}`}>{storeEmail}</a>.
          </>
        ) : null}
      </p>
      <p>
        A plataforma tecnológica é fornecida pela AutoPainel, que atua como operadora de
        tratamento conforme instruções da concessionária. Dúvidas sobre a plataforma:{" "}
        <a href={`mailto:${PLATFORM_PRIVACY_EMAIL}`}>{PLATFORM_PRIVACY_EMAIL}</a>.
      </p>

      <h2>2. Dados que coletamos</h2>
      <ul>
        <li>
          Dados informados em formulários (nome, e-mail, telefone, mensagem, veículo de interesse).
        </li>
        <li>
          Dados de navegação (IP, páginas visitadas) — apenas com consentimento para analytics.
        </li>
        <li>Preferências de cookies armazenadas no seu navegador.</li>
      </ul>

      <h2>3. Finalidades</h2>
      <ul>
        <li>Atender seu interesse em veículos e retornar contato comercial.</li>
        <li>Simular financiamento quando você solicitar.</li>
        <li>Medir desempenho do site (analytics), somente com consentimento.</li>
        <li>Segurança e prevenção a fraudes.</li>
      </ul>

      <h2>4. Compartilhamento</h2>
      <p>
        Seus dados podem ser acessados pela equipe autorizada da {storeName} e por prestadores
        essenciais (hospedagem, e-mail, analytics), sempre com medidas de segurança. Não vendemos
        seus dados.
      </p>

      <h2>5. Seus direitos</h2>
      <p>
        Você pode solicitar acesso, correção, exclusão, portabilidade ou revogação de consentimento
        entrando em contato pelos canais acima.
      </p>

      <h2>6. Cookies</h2>
      <p>
        Detalhes em{" "}
        <Link href="/politica-de-cookies">Política de Cookies</Link>.
      </p>

      <h2>7. Plataforma AutoPainel</h2>
      <p>
        Informações adicionais sobre a operadora da plataforma em{" "}
        <a href={`${PLATFORM_LEGAL_URL}/politica-de-privacidade`} target="_blank" rel="noopener noreferrer">
          autopainel.com.br
        </a>
        .
      </p>
    </StorefrontLegalPageLayout>
  );
}
