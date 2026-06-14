import type { Metadata } from "next";
import Link from "next/link";

import { StorefrontLegalPageLayout } from "@/components/storefront/storefront-legal-page-layout";
import { STOREFRONT_LEGAL_VERSION } from "@/lib/legal/constants";
import { getDealershipPublicRecord } from "@/lib/tenant/get-dealership-public-record";

export async function generateMetadata(): Promise<Metadata> {
  const dealership = await getDealershipPublicRecord();
  const name = dealership?.name ?? "Concessionária";
  return {
    title: `Política de Cookies — ${name}`,
    description: `Como ${name} utiliza cookies neste site e como gerenciar suas preferências.`,
  };
}

export default async function PoliticaDeCookiesPage() {
  const dealership = await getDealershipPublicRecord();
  const storeName = dealership?.name ?? "esta concessionária";

  return (
    <StorefrontLegalPageLayout
      title="Política de Cookies"
      description={`Tipos de cookies, finalidades e como alterar suas preferências no site de ${storeName}.`}
      lastUpdated={STOREFRONT_LEGAL_VERSION}
    >
      <p>
        Cookies são pequenos arquivos armazenados no seu navegador. Utilizamos cookies para
        funcionamento do site e, com seu consentimento, para analytics.
      </p>

      <h2>1. Cookies essenciais</h2>
      <p>
        Necessários para segurança e preferências básicas (ex.: registro da sua escolha no banner
        de cookies). Não exigem consentimento prévio.
      </p>
      <ul>
        <li>
          <strong>ap-cookie-consent</strong> — armazena se você aceitou apenas cookies essenciais
          ou também analytics.
        </li>
      </ul>

      <h2>2. Cookies de analytics (opcionais)</h2>
      <p>
        Só são ativados se você clicar em <strong>Aceitar todos</strong> no banner. Utilizamos
        Google Tag Manager para entender tráfego e melhorar a experiência. Dados agregados, sem
        venda a terceiros.
      </p>

      <h2>3. Como gerenciar</h2>
      <ul>
        <li>Use o banner na primeira visita ou limpe cookies do navegador para rever a escolha.</li>
        <li>
          Configurações do navegador permitem bloquear cookies — partes do site podem deixar de
          funcionar corretamente.
        </li>
      </ul>

      <h2>4. Privacidade</h2>
      <p>
        Mais detalhes em{" "}
        <Link href="/politica-de-privacidade">Política de Privacidade</Link>.
      </p>
    </StorefrontLegalPageLayout>
  );
}
