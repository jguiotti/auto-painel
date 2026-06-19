"use server";

import { createSupabaseAnonClient } from "@autopainel/shared/lib/supabase";

import { PRIVACY_POLICY_VERSION } from "@/lib/legal/constants";

export interface SubmitSaasProspectState {
  success?: boolean;
  error?: string;
}

const EMAIL_RE =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export async function submitSaasProspectAction(
  _prevState: SubmitSaasProspectState | null,
  formData: FormData,
): Promise<SubmitSaasProspectState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const companyNameRaw = String(formData.get("company_name") ?? "").trim();
  const messageRaw = String(formData.get("message") ?? "").trim();
  const leadChannel = String(formData.get("lead_channel") ?? "contact_form").trim();
  const privacyConsent = formData.get("privacy_consent") === "true";
  const marketingConsent = formData.get("marketing_consent") === "true";

  if (!privacyConsent) {
    return { error: "Para enviar, aceite a Política de Privacidade." };
  }

  if (fullName.length < 2) {
    return { error: "Informe seu nome completo." };
  }

  if (email.length < 3 || !EMAIL_RE.test(email)) {
    return { error: "Informe um e-mail válido." };
  }

  if (leadChannel === "whatsapp_float" && phoneRaw.length < 8) {
    return { error: "Informe seu WhatsApp ou telefone para continuar." };
  }

  if (phoneRaw.length > 40) {
    return { error: "Telefone muito longo." };
  }

  if (companyNameRaw.length > 200) {
    return { error: "Nome da empresa muito longo." };
  }

  if (messageRaw.length > 10000) {
    return { error: "Mensagem muito longa." };
  }

  let supabase;
  try {
    supabase = createSupabaseAnonClient();
  } catch {
    return { error: "Configuração do servidor incompleta. Tente mais tarde." };
  }

  const nowIso = new Date().toISOString();

  const { error } = await supabase.from("saas_prospects").insert({
    full_name: fullName,
    email,
    phone: phoneRaw.length > 0 ? phoneRaw : null,
    company_name: companyNameRaw.length > 0 ? companyNameRaw : null,
    message: messageRaw.length > 0 ? messageRaw : null,
    source: "marketing_site",
    metadata: {
      privacy_policy_version: PRIVACY_POLICY_VERSION,
      lead_channel: leadChannel,
    } as Record<string, unknown>,
    privacy_policy_accepted_at: nowIso,
    privacy_policy_version: PRIVACY_POLICY_VERSION,
    marketing_consent: marketingConsent,
    marketing_consent_at: marketingConsent ? nowIso : null,
  });

  if (error) {
    return {
      error:
        "Não foi possível enviar agora. Verifique os dados ou tente novamente em instantes.",
    };
  }

  return { success: true };
}
