import Link from "next/link";

import { CONTACT_EMAIL, PRIVACY_EMAIL } from "@/lib/legal/constants";

export function TermsOfUseContent() {
  return (
    <>
      <p>
        Ao acessar <strong>autopainel.com.br</strong> ou utilizar a plataforma AutoPainel, você
        concorda com estes Termos de Uso. Se não concordar, não utilize nossos serviços.
      </p>

      <h2>1. Objeto</h2>
      <p>
        A AutoPainel oferece software como serviço (SaaS) para gestão digital de concessionárias,
        incluindo vitrine, estoque, leads e módulos opcionais contratados por plano.
      </p>

      <h2>2. Site institucional</h2>
      <p>
        O conteúdo do site é informativo. Preços publicados em{" "}
        <Link href="/planos" className="text-marketing-accent hover:underline" target="_blank">
          /planos
        </Link>{" "}
        (mensalidades e setup) são referência comercial; condições finais constam do contrato
        assinado entre as partes.
      </p>

      <h2>3. Cadastro e conta</h2>
      <p>
        O acesso ao painel da concessionária requer credenciais fornecidas após contratação. Você é
        responsável por manter suas credenciais seguras e pelo uso feito por sua equipe.
      </p>

      <h2>4. Uso aceitável</h2>
      <ul>
        <li>Não utilizar a plataforma para fins ilícitos ou que violem direitos de terceiros.</li>
        <li>Não tentar acessar dados de outras concessionárias ou burlar isolamento de tenant.</li>
        <li>Respeitar limites do plano contratado e integrações habilitadas.</li>
      </ul>

      <h2>5. Propriedade intelectual</h2>
      <p>
        A marca AutoPainel, software, layout e documentação são de titularidade da operadora da
        plataforma. Conteúdos inseridos pela concessionária (fotos, textos de veículos) permanecem
        de responsabilidade do cliente.
      </p>

      <h2>6. Privacidade</h2>
      <p>
        O tratamento de dados pessoais rege-se pela{" "}
        <Link
          href="/politica-de-privacidade"
          className="text-marketing-accent hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Política de Privacidade
        </Link>
        .
      </p>

      <h2>7. Limitação de responsabilidade</h2>
      <p>
        Empregamos boas práticas de segurança e disponibilidade, porém não garantimos operação
        ininterrupta. Integrações com terceiros (Meta, OLX, WebMotors) dependem também das políticas
        e disponibilidade desses provedores.
      </p>

      <h2>8. Alterações</h2>
      <p>
        Podemos atualizar estes termos. A data da última versão aparece no topo desta página.
        Alterações relevantes serão comunicadas por canais adequados.
      </p>

      <h2>9. Foro e lei aplicável</h2>
      <p>
        Aplica-se a legislação brasileira. Fica eleito o foro da Comarca de Mongaguá/SP, com
        renúncia a qualquer outro, salvo disposição contratual específica em contrato comercial
        assinado entre as partes.
      </p>

      <h2>10. Contato</h2>
      <p>
        Dúvidas:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="text-marketing-accent hover:underline">
          {CONTACT_EMAIL}
        </a>
        <br />
        Privacidade:{" "}
        <a href={`mailto:${PRIVACY_EMAIL}`} className="text-marketing-accent hover:underline">
          {PRIVACY_EMAIL}
        </a>
      </p>
    </>
  );
}
