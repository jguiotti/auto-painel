import type { DealershipOnboardingIntakeRpcErrorCode } from "../../types/dealership-onboarding-intake";

const RPC_ERROR_MESSAGES: Record<DealershipOnboardingIntakeRpcErrorCode, string> = {
  payload_required: "Dados do formulário incompletos. Volte e preencha os campos obrigatórios.",
  trial_legal_version_required: "Versão do termo de trial inválida. Recarregue a página e tente novamente.",
  trial_acceptance_required: "Aceite o Termo de Adesão ao Trial para continuar.",
  store_name_required: "Informe o nome da loja.",
  contact_email_invalid: "Informe um e-mail de contato válido.",
  saas_prospect_not_found: "Lead comercial não encontrado. Verifique o link ou envie sem vínculo.",
  forbidden: "Você não tem permissão para esta ação.",
  intake_not_found: "Adesão não encontrada ou já arquivada.",
  intake_already_converted: "Esta adesão já foi convertida em outra concessionária.",
  intake_not_archivable: "Não é possível arquivar: adesão convertida ou inexistente.",
  intake_not_updatable: "Esta adesão não pode mais ser atualizada.",
  dealership_not_found: "Concessionária não encontrada.",
};

export function mapOnboardingIntakeRpcError(rawMessage: string): string {
  const lower = rawMessage.toLowerCase();
  for (const [code, message] of Object.entries(RPC_ERROR_MESSAGES)) {
    if (lower.includes(code)) {
      return message;
    }
  }
  if (lower.includes("unique") || lower.includes("23505")) {
    return "Algum dado informado já está em uso. Verifique subdomínio, CNPJ ou e-mail.";
  }
  return "Não foi possível registrar sua adesão agora. Verifique os dados ou tente novamente em instantes.";
}

export function mapOnboardingIntakeUploadError(
  kind: string,
  reason: "size" | "format" | "upload",
): string {
  const friendlyKind: Record<string, string> = {
    "logo-dark": "logo escuro",
    "logo-light": "logo claro",
    "footer-logo": "logo do rodapé",
    favicon: "favicon",
    "hero-background": "banner principal",
  };
  const label = friendlyKind[kind] ?? kind;
  if (reason === "size") {
    return `O arquivo «${label}» passou do tamanho máximo. Reduza a imagem ou escolha outro formato.`;
  }
  if (reason === "format") {
    return `Formato não aceito em «${label}». Use JPG, PNG ou WebP.`;
  }
  return `Não foi possível enviar «${label}». Tente outro arquivo ou envie só os dados textuais — nossa equipe solicita os arquivos depois.`;
}
