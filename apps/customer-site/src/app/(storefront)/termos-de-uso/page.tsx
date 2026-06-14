import type { Metadata } from "next";
import Link from "next/link";

import { StorefrontLegalPageLayout } from "@/components/storefront/storefront-legal-page-layout";
import { STOREFRONT_LEGAL_VERSION } from "@/lib/legal/constants";
import { getDealershipPublicRecord } from "@/lib/tenant/get-dealership-public-record";

export async function generateMetadata(): Promise<Metadata> {
  const dealership = await getDealershipPublicRecord();
  const name = dealership?.name ?? "Concessionária";
  return {
    title: `Termos de Uso — ${name}`,
    description: `Condições de uso do site de ${name}.`,
  };
}

export default async function TermosDeUsoPage() {
  const dealership = await getDealershipPublicRecord();
  const storeName = dealership?.name ?? "esta concessionária";

  return (
    <StorefrontLegalPageLayout
      title="Termos de Uso"
      description={`Condições gerais de acesso e uso do site de ${storeName}.`}
      lastUpdated={STOREFRONT_LEGAL_VERSION}
    >
      <p>
        Ao navegar neste site, você concorda com estes Termos de Uso. Se não concordar, não
        utilize nossos serviços online.
      </p>

      <h2>1. Objeto</h2>
      <p>
        Este site apresenta veículos, condições comerciais e canais de contato da{" "}
        <strong>{storeName}</strong>. As informações têm caráter informativo e podem ser
        alteradas sem aviso prévio até confirmação comercial.
      </p>

      <h2>2. Conteúdo e preços</h2>
      <p>
        Fotos, descrições e valores exibidos dependem de disponibilidade de estoque. Erros
        tipográficos ou de cadastro serão corrigidos quando identificados. A negociação final
        ocorre diretamente com a equipe da loja.
      </p>

      <h2>3. Uso aceitável</h2>
      <ul>
        <li>Não utilizar o site para fins ilícitos ou que violem direitos de terceiros.</li>
        <li>Não tentar acessar áreas restritas, dados de outras lojas ou sistemas internos.</li>
        <li>Fornecer informações verdadeiras nos formulários de contato.</li>
      </ul>

      <h2>4. Propriedade intelectual</h2>
      <p>
        Marcas, logotipos e conteúdos institucionais da {storeName} são de titularidade da
        concessionária ou licenciados. A tecnologia da vitrine é operada via plataforma
        AutoPainel.
      </p>

      <h2>5. Privacidade</h2>
      <p>
        O tratamento de dados pessoais rege-se pela{" "}
        <Link href="/politica-de-privacidade">Política de Privacidade</Link>.
      </p>

      <h2>6. Limitação de responsabilidade</h2>
      <p>
        Empregamos boas práticas de segurança, porém não garantimos operação ininterrupta.
        Integrações com terceiros (portais, redes sociais) dependem também das políticas desses
        provedores.
      </p>

      <h2>7. Contato</h2>
      <p>
        Dúvidas sobre estes termos podem ser enviadas pelos canais de contato disponíveis no
        site da loja.
      </p>
    </StorefrontLegalPageLayout>
  );
}
