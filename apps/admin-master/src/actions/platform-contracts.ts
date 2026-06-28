"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { sendContractAcceptanceEmail } from "@/lib/email/send-contract-acceptance-email";

const REVALIDATE_PATHS = ["/painel/contratos"];

interface ActionResult {
  error?: string;
  success?: boolean;
  contractId?: string;
}

function buildBodySnapshot(
  templateBody: string,
  annex: {
    counterpartyName: string;
    counterpartyEmail: string;
    planName: string;
    monthlyAmount: string;
    cnpj: string;
  },
): string {
  return `${templateBody.trim()}

---

## Anexo I (preenchido)

| Campo | Valor |
| --- | --- |
| Contratante | ${annex.counterpartyName} |
| E-mail | ${annex.counterpartyEmail} |
| CNPJ | ${annex.cnpj || "—"} |
| Plano | ${annex.planName} |
| Valor mensal | R$ ${annex.monthlyAmount} |
`;
}

export async function createPlatformContractAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const templateId = String(formData.get("template_id") ?? "").trim();
  const counterpartyName = String(formData.get("counterparty_name") ?? "").trim();
  const counterpartyEmail = String(formData.get("counterparty_email") ?? "").trim();
  const planName = String(formData.get("plan_name") ?? "").trim();
  const monthlyAmountRaw = String(formData.get("monthly_amount") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").trim();
  const reviewNotes = String(formData.get("review_notes") ?? "").trim();
  const saasProspectId = String(formData.get("saas_prospect_id") ?? "").trim() || null;

  if (!templateId) {
    return { error: "Selecione um modelo de contrato." };
  }
  if (counterpartyName.length < 2) {
    return { error: "Informe o nome da contratante." };
  }
  if (!counterpartyEmail.includes("@")) {
    return { error: "Informe um e-mail válido da contratante." };
  }
  if (planName.length < 2) {
    return { error: "Informe o plano comercial." };
  }
  const monthlyAmount = Number(monthlyAmountRaw.replace(",", "."));
  if (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0) {
    return { error: "Informe o valor mensal válido." };
  }

  const { data: template, error: templateError } = await supabase
    .from("platform_contract_templates")
    .select("id, version, body_md")
    .eq("id", templateId)
    .single();

  if (templateError || !template) {
    return { error: "Modelo de contrato não encontrado." };
  }

  const bodySnapshot = buildBodySnapshot(template.body_md as string, {
    counterpartyName,
    counterpartyEmail,
    planName,
    monthlyAmount: monthlyAmount.toFixed(2),
    cnpj,
  });

  const { data: inserted, error } = await supabase
    .from("platform_contracts")
    .insert({
      template_id: templateId,
      template_version: template.version as number,
      saas_prospect_id: saasProspectId,
      counterparty_name: counterpartyName,
      counterparty_email: counterpartyEmail,
      plan_name: planName,
      monthly_amount: monthlyAmount,
      status: "draft",
      review_notes: reviewNotes || null,
      body_snapshot_md: bodySnapshot,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return { error: "Não foi possível criar o contrato." };
  }

  if (saasProspectId) {
    const { data: leadRow } = await supabase
      .from("saas_prospects")
      .select("metadata, pipeline_status")
      .eq("id", saasProspectId)
      .maybeSingle();

    if (leadRow) {
      const metadata =
        leadRow.metadata && typeof leadRow.metadata === "object"
          ? { ...(leadRow.metadata as Record<string, unknown>) }
          : {};
      metadata.last_contract_id = inserted.id as string;

      const nextPipeline =
        leadRow.pipeline_status === "won" || leadRow.pipeline_status === "onboarding"
          ? leadRow.pipeline_status
          : "proposal_sent";

      await supabase
        .from("saas_prospects")
        .update({
          pipeline_status: nextPipeline,
          metadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", saasProspectId);
    }
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  revalidatePath("/painel/leads-comerciais");
  return { success: true, contractId: inserted.id as string };
}

export async function updatePlatformContractDraftAction(
  contractId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();
  const reviewNotes = String(formData.get("review_notes") ?? "").trim();

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: loadError } = await supabase
    .from("platform_contracts")
    .select("status")
    .eq("id", contractId)
    .single();

  if (loadError || !existing) {
    return { error: "Contrato não encontrado." };
  }
  if (existing.status !== "draft") {
    return {
      error: "Contratos enviados ou assinados não podem ser editados — gere um aditivo.",
    };
  }

  const { error } = await supabase
    .from("platform_contracts")
    .update({
      review_notes: reviewNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId);

  if (error) {
    return { error: "Não foi possível salvar as notas de revisão." };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  revalidatePath(`/painel/contratos/${contractId}`);
  return { success: true };
}

export async function sendPlatformContractForAcceptanceAction(
  contractId: string,
): Promise<ActionResult & { emailSent?: boolean; emailError?: string }> {
  await requireAdminSession();

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: loadError } = await supabase
    .from("platform_contracts")
    .select("status, counterparty_name, counterparty_email, plan_name")
    .eq("id", contractId)
    .single();

  if (loadError || !existing) {
    return { error: "Contrato não encontrado." };
  }
  if (existing.status !== "draft" && existing.status !== "sent_for_acceptance") {
    return { error: "Somente rascunhos ou contratos pendentes podem receber novo link." };
  }

  const { data: tokenPayload, error: tokenError } = await supabase.rpc(
    "issue_platform_contract_acceptance_token",
    {
      p_contract_id: contractId,
      p_expires_in_days: 7,
    },
  );

  if (tokenError || !tokenPayload) {
    return { error: "Não foi possível gerar o link de aceite." };
  }

  const tokenRow = tokenPayload as Record<string, unknown>;
  const rawToken = String(tokenRow.token ?? "");
  if (rawToken.length < 16) {
    return { error: "Token de aceite inválido." };
  }

  const emailResult = await sendContractAcceptanceEmail({
    to: String(existing.counterparty_email),
    recipientName: String(existing.counterparty_name),
    storeName: String(existing.plan_name ?? existing.counterparty_name),
    acceptanceToken: rawToken,
  });

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  revalidatePath(`/painel/contratos/${contractId}`);

  if (!emailResult.ok) {
    return {
      success: true,
      emailSent: false,
      emailError: emailResult.error ?? "Falha ao enviar e-mail.",
    };
  }

  return { success: true, emailSent: true };
}

/** @deprecated Use sendPlatformContractForAcceptanceAction */
export async function sendPlatformContractForSignatureAction(
  contractId: string,
): Promise<ActionResult> {
  return sendPlatformContractForAcceptanceAction(contractId);
}

export async function markPlatformContractAcceptedManuallyAction(
  contractId: string,
  reference: string,
): Promise<ActionResult> {
  await requireAdminSession();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("mark_platform_contract_accepted_manually", {
    p_contract_id: contractId,
    p_reference: reference.trim() || null,
  });

  if (error) {
    return { error: "Não foi possível registrar o aceite manual." };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  revalidatePath(`/painel/contratos/${contractId}`);
  return { success: true };
}

export async function markPlatformContractSignedAction(
  contractId: string,
  signatureRef: string,
  options?: {
    salesRepId?: string | null;
    dealershipId?: string | null;
  },
): Promise<ActionResult & { attributionId?: string | null }> {
  await requireAdminSession();
  const ref = signatureRef.trim();
  if (ref.length < 2) {
    return { error: "Informe a referência do provedor de assinatura." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: loadError } = await supabase
    .from("platform_contracts")
    .select("status, dealership_id")
    .eq("id", contractId)
    .single();

  if (loadError || !existing) {
    return { error: "Contrato não encontrado." };
  }
  if (existing.status !== "sent_for_signature" && existing.status !== "sent_for_acceptance") {
    return { error: "Somente contratos enviados podem ser marcados como aceitos." };
  }

  const { error } = await supabase
    .from("platform_contracts")
    .update({
      status: "signed",
      signature_provider_ref: ref,
      signed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", contractId);

  if (error) {
    return { error: "Não foi possível registrar a assinatura." };
  }

  const salesRepId = options?.salesRepId?.trim() || null;
  const dealershipId =
    options?.dealershipId?.trim() || (existing.dealership_id as string | null);

  let attributionId: string | null = null;
  if (salesRepId && dealershipId) {
    const { data: attId, error: attError } = await supabase.rpc(
      "provision_attribution_from_signed_contract",
      {
        p_contract_id: contractId,
        p_sales_rep_id: salesRepId,
        p_dealership_id: dealershipId,
        p_confirm_immediately: true,
      },
    );
    if (attError) {
      REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
      revalidatePath(`/painel/contratos/${contractId}`);
      revalidatePath("/painel/equipe/comercial");
      return {
        error:
          "Contrato assinado, mas não foi possível criar o vínculo comercial automaticamente.",
      };
    }
    attributionId = (attId as string | null) ?? null;
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  revalidatePath(`/painel/contratos/${contractId}`);
  revalidatePath("/painel/equipe/comercial");
  revalidatePath("/painel/leads-comerciais");
  return { success: true, attributionId };
}
