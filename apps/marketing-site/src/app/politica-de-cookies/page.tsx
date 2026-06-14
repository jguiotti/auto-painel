import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageLayout } from "@/components/legal-page-layout";
import { LEGAL_SITE_URL, PRIVACY_POLICY_VERSION } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description:
    "Como a AutoPainel utiliza cookies no site institucional e como gerenciar suas preferências.",
  alternates: { canonical: `${LEGAL_SITE_URL}/politica-de-cookies` },
  robots: { index: true, follow: true },
};

export default function PoliticaDeCookiesPage() {
  return (
    <LegalPageLayout
      title="Política de Cookies"
      description="Tipos de cookies, finalidades e como alterar suas preferências no site AutoPainel."
      lastUpdated={PRIVACY_POLICY_VERSION}
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
        Google Tag Manager para entender tráfego e melhorar conversão do site. Dados agregados,
        sem venda a terceiros.
      </p>

      <h2>3. Como gerenciar</h2>
      <ul>
        <li>Use o banner na primeira visita ou limpe cookies do navegador para rever a escolha.</li>
        <li>Configurações do navegador permitem bloquear cookies — partes do site podem deixar de funcionar corretamente.</li>
      </ul>

      <h2>4. Alterações</h2>
      <p>
        Atualizamos esta política quando mudamos ferramentas ou categorias de cookies. A data
        vigente aparece no topo da página.
      </p>

      <h2>5. Privacidade</h2>
      <p>
        Mais detalhes em{" "}
        <Link href="/politica-de-privacidade" className="text-marketing-accent hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </LegalPageLayout>
  );
}
