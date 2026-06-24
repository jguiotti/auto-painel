export interface MarketingFaqItem {
  question: string;
  answer: string;
}

/** Fonte única de FAQ — renderizada em `/perguntas-frequentes`. */
export const MARKETING_FAQ_ITEMS: MarketingFaqItem[] = [
  {
    question: "Quanto custa o AutoPainel?",
    answer:
      "Mensalidade a partir de R$ 197/mês (Essencial), R$ 397/mês (Profissional) e R$ 997/mês (Completo), conforme módulos e faixa de estoque. A taxa única de setup de R$ 497 é obrigatória na contratação e cobre configuração completa da vitrine, painel e importação inicial do estoque. Valores mensais; impostos podem ser aplicados conforme contrato.",
  },
  {
    question: "Em quanto tempo minha loja fica no ar?",
    answer:
      "Em um dia útil após o contato comercial e confirmação do setup. Nossa equipe configura vitrine, cores, logo, domínio e importação inicial do estoque — você recebe o painel pronto para publicar veículos e receber leads.",
  },
  {
    question: "Como funciona a configuração passo a passo?",
    answer:
      "1) Você entra em contato e escolhe o plano. 2) Pagamos o setup e alinhamos marca (logo, cores, layout). 3) Configuramos vitrine, painel e domínio. 4) Importamos seu estoque inicial. 5) Treinamos sua equipe no painel. 6) Sua loja já encanta clientes online — você foca em vender.",
  },
  {
    question: "Gestão de leads está incluída em todos os planos?",
    answer:
      "Sim. A central de contatos (leads da vitrine, simulador e formulários) faz parte da base da plataforma — não é módulo opcional. Gestores distribuem leads; vendedores acompanham status, notas e follow-up com o veículo de interesse sempre visível.",
  },
  {
    question: "Preciso pagar extra para gerenciar o estoque no painel?",
    answer:
      "Não. Cadastro de veículos, fotos, preços e status (disponível/vendido) com vitrine sincronizada está incluído em qualquer plano. O tier de plano considera principalmente o volume de veículos ativos; módulos extras são simulador, QR Code, integrações com portais, recibo e métricas avançadas.",
  },
  {
    question: "Como funciona o trial grátis do plano Essencial?",
    answer:
      "São vagas limitadas para os primeiros 20 lojistas interessados: 30 dias grátis no plano Essencial, com taxa de setup de R$ 497 isenta excepcionalmente nessa campanha. Preencha o formulário em autopainel.com.br/adesao-trial. Se as vagas imediatas estiverem preenchidas, você pode solicitar o trial mesmo assim e entrará na fila de espera — entraremos em contato quando abrirem novas vagas.",
  },
  {
    question: "Posso testar o painel antes de contratar?",
    answer:
      "Sim. Agende uma demonstração pelo formulário de contato ou WhatsApp, ou solicite o trial grátis em autopainel.com.br/adesao-trial (vagas limitadas). Mostramos vitrine e painel ao vivo; o acesso de teste ao painel é liberado pela nossa equipe após qualificação — não há login público aberto por segurança das lojas.",
  },
  {
    question: "O que inclui a taxa de setup obrigatória?",
    answer:
      "Onboarding assistido, configuração da vitrine (layout, tema claro ou escuro, logo e cores), painel da loja, domínio/subdomínio e importação inicial do estoque. É cobrada uma única vez na contratação, separada da mensalidade.",
  },
  {
    question: "Como o estoque influencia o plano?",
    answer:
      "Usamos o número de veículos ativos como referência: Essencial até 10, Profissional de 11 a 30 e Completo acima de 30. Na demonstração confirmamos a faixa ideal — se o pátio crescer, o plano pode ser ajustado.",
  },
  {
    question: "Preciso de agência para manter o site?",
    answer:
      "Não. Sua equipe atualiza estoque, fotos e preços direto no painel; a vitrine reflete na hora, com a marca da concessionária.",
  },
  {
    question: "Posso ver exemplos de vitrine antes de contratar?",
    answer:
      "Sim. Na página inicial há três vitrines demo (layouts Premium, Clássico e Moderno) para você comparar design e experiência — são ambientes de demonstração, sem acesso ao painel administrativo.",
  },
  {
    question: "Quais portais e redes integra?",
    answer:
      "OLX e WebMotors (conforme plano Completo e homologação). Redes sociais via Meta (Facebook e Instagram Business).",
  },
];
