"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { requireAdminSession } from "@/lib/auth/require-admin";
import {
  PLATFORM_LEAD_MANUAL_CHANNELS,
  PLATFORM_LEAD_PIPELINE_STATUSES,
  type PlatformLeadManualChannel,
  type PlatformLeadPipelineStatus,
} from "@/lib/data/platform-commercial-leads-shared";

const REVALIDATE_PATHS = [
  "/painel/leads-comerciais",
  "/painel/dashboard",
  "/painel/adesoes-trial",
];

const EMAIL_RE =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

interface ActionResult {
  error?: string;
  success?: boolean;
  leadId?: string;
}

function isPipelineStatus(value: string): value is PlatformLeadPipelineStatus {
  return (PLATFORM_LEAD_PIPELINE_STATUSES as readonly string[]).includes(value);
}

function isManualChannel(value: string): value is PlatformLeadManualChannel {
  return PLATFORM_LEAD_MANUAL_CHANNELS.some((item) => item.value === value);
}

export async function createPlatformCommercialLeadAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const companyNameRaw = String(formData.get("company_name") ?? "").trim();
  const messageRaw = String(formData.get("message") ?? "").trim();
  const cnpjRaw = String(formData.get("cnpj") ?? "").trim();
  const pipelineStatusRaw = String(formData.get("pipeline_status") ?? "new").trim();
  const leadChannelRaw = String(formData.get("lead_channel") ?? "outbound").trim();

  if (fullName.length < 2) {
    return { error: "Informe o nome do contato (mínimo 2 caracteres)." };
  }
  if (email.length < 3 || !EMAIL_RE.test(email)) {
    return { error: "Informe um e-mail válido." };
  }
  if (phoneRaw.length > 40) {
    return { error: "Telefone muito longo." };
  }
  if (companyNameRaw.length > 200) {
    return { error: "Nome da empresa muito longo." };
  }
  if (messageRaw.length > 10000) {
    return { error: "Observações muito longas." };
  }
  if (!isPipelineStatus(pipelineStatusRaw)) {
    return { error: "Estágio do pipeline inválido." };
  }
  if (!isManualChannel(leadChannelRaw)) {
    return { error: "Canal de origem inválido." };
  }

  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return { error: "Serviço indisponível. Verifique a configuração do Supabase." };
  }

  const nowIso = new Date().toISOString();
  const metadata: Record<string, unknown> = {
    lead_channel: leadChannelRaw,
    created_via: "admin_manual",
  };
  if (cnpjRaw.length > 0) {
    metadata.cnpj = cnpjRaw;
  }

  const { data, error } = await supabase
    .from("saas_prospects")
    .insert({
      full_name: fullName,
      email,
      phone: phoneRaw.length > 0 ? phoneRaw : null,
      company_name: companyNameRaw.length > 0 ? companyNameRaw : null,
      message: messageRaw.length > 0 ? messageRaw : null,
      source: "admin_manual",
      metadata,
      pipeline_status: pipelineStatusRaw,
      privacy_policy_accepted_at: null,
      privacy_policy_version: null,
      marketing_consent: false,
      marketing_consent_at: null,
      updated_at: nowIso,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { error: "Não foi possível cadastrar o lead. Tente novamente." };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  return { success: true, leadId: data.id as string };
}

export async function updatePlatformCommercialLeadPipelineAction(
  leadId: string,
  pipelineStatus: string,
): Promise<ActionResult> {
  await requireAdminSession();

  if (!leadId) {
    return { error: "Lead inválido." };
  }

  if (!isPipelineStatus(pipelineStatus)) {
    return { error: "Estágio do pipeline inválido." };
  }

  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return { error: "Serviço indisponível." };
  }

  const { error } = await supabase
    .from("saas_prospects")
    .update({
      pipeline_status: pipelineStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) {
    return { error: "Não foi possível atualizar o lead. Tente novamente." };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  return { success: true };
}

export async function linkCommercialLeadToDealershipAction(
  leadId: string,
  dealershipId: string,
): Promise<ActionResult> {
  await requireAdminSession();

  if (!leadId || !dealershipId) {
    return { error: "Lead ou concessionária inválidos." };
  }

  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return { error: "Serviço indisponível." };
  }

  const { data: lead, error: loadError } = await supabase
    .from("saas_prospects")
    .select("metadata")
    .eq("id", leadId)
    .maybeSingle();

  if (loadError || !lead) {
    return { error: "Lead não encontrado." };
  }

  const metadata =
    lead.metadata && typeof lead.metadata === "object"
      ? { ...(lead.metadata as Record<string, unknown>) }
      : {};

  metadata.dealership_id = dealershipId;

  const { error } = await supabase
    .from("saas_prospects")
    .update({
      pipeline_status: "onboarding",
      metadata,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId);

  if (error) {
    return { error: "Não foi possível vincular o lead à loja." };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  return { success: true };
}

export async function deletePlatformCommercialLeadAction(
  leadId: string,
): Promise<ActionResult> {
  await requireAdminSession();

  if (!leadId) {
    return { error: "Lead inválido." };
  }

  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return { error: "Serviço indisponível." };
  }

  const { error } = await supabase.from("saas_prospects").delete().eq("id", leadId);

  if (error) {
    return { error: "Não foi possível excluir o lead. Tente novamente." };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  return { success: true };
}
