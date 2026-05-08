"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { requireAdminSession } from "@/lib/auth/require-admin";
import {
  parseBillingSupportingDocuments,
  type BillingSupportingDocKind,
} from "@/lib/data/dealership-operator-billing";

export interface BillingActionResult {
  error?: string;
  success?: boolean;
  signedUrl?: string;
  warning?: string;
}

const SUBSCRIPTION_STATUSES = new Set([
  "trialing",
  "active",
  "past_due",
  "cancelled",
  "paused",
]);

const REVALIDATE = ["/painel/concessionarias", "/painel/financeiro"];

const BILLING_DOCS_BUCKET = "dealership-operator-billing";

const MAX_BILLING_DOC_BYTES = 25 * 1024 * 1024;

const ALLOWED_BILLING_DOC_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const DOC_KINDS = new Set<BillingSupportingDocKind>([
  "contract",
  "receipt",
  "invoice",
  "other",
]);

function billingRevalidate(dealershipId: string): void {
  REVALIDATE.forEach((p) => revalidatePath(p));
  revalidatePath(`/painel/concessionarias/${dealershipId}/editar`);
}

function safeDocumentBaseName(original: string): string {
  const base = original.split(/[/\\]/).pop() ?? "document";
  return base.replace(/[^\w.-]+/g, "_").slice(0, 120);
}

function parseNullableDate(raw: string): string | null {
  if (raw.length === 0) {
    return null;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString().slice(0, 10);
}

function isMissingBillingTableError(message: string, code?: string): boolean {
  const m = message.toLowerCase();
  return (
    code === "42P01" ||
    m.includes("does not exist") ||
    (m.includes("relation") && m.includes("not found")) ||
    (m.includes("column") && m.includes("does not exist"))
  );
}

/**
 * Single save for commercial subscription fields plus operator billing snapshot.
 */
export async function saveDealershipCommercialFinanceAction(
  dealershipId: string,
  formData: FormData,
): Promise<BillingActionResult> {
  await requireAdminSession();

  const subscription_status = String(
    formData.get("subscription_status") ?? "",
  ).trim();
  const billing_notes = String(formData.get("billing_notes") ?? "").trim();

  const monthly_amount = Number(
    String(formData.get("billing_monthly_amount") ?? "").replace(",", "."),
  );
  const due_day = Number(String(formData.get("billing_due_day") ?? "").trim());
  const payment_method = String(
    formData.get("billing_payment_method") ?? "",
  ).trim();
  const last_payment_raw = String(
    formData.get("billing_last_payment_date") ?? "",
  ).trim();
  const agreement_status = String(
    formData.get("billing_agreement_status") ?? "active",
  ).trim();
  const contract_start_raw = String(
    formData.get("billing_contract_started_on") ?? "",
  ).trim();
  const contract_end_raw = String(
    formData.get("billing_contract_ends_on") ?? "",
  ).trim();

  if (!SUBSCRIPTION_STATUSES.has(subscription_status)) {
    return { error: "Estado de cobrança inválido." };
  }
  if (Number.isNaN(monthly_amount) || monthly_amount < 0) {
    return { error: "Valor mensal inválido." };
  }
  if (!Number.isInteger(due_day) || due_day < 1 || due_day > 28) {
    return {
      error: "Dia de vencimento deve ser entre 1 e 28.",
    };
  }

  const allowedAgreement = ["draft", "active", "paused", "terminated"];
  if (!allowedAgreement.includes(agreement_status)) {
    return { error: "Estado do acordo técnico inválido." };
  }

  let last_payment_date: string | null = null;
  if (last_payment_raw.length > 0) {
    const d = new Date(last_payment_raw);
    if (Number.isNaN(d.getTime())) {
      return { error: "Data do último pagamento inválida." };
    }
    last_payment_date = d.toISOString();
  }

  const contract_started_on = parseNullableDate(contract_start_raw);
  const contract_ends_on = parseNullableDate(contract_end_raw);
  if (contract_start_raw.length > 0 && !contract_started_on) {
    return { error: "Data de início do contrato inválida." };
  }
  if (contract_end_raw.length > 0 && !contract_ends_on) {
    return { error: "Data de fim do contrato inválida." };
  }
  if (
    contract_started_on &&
    contract_ends_on &&
    contract_ends_on < contract_started_on
  ) {
    return {
      error: "O fim do período contratual não pode ser antes do início.",
    };
  }

  const supabase = createSupabaseServiceRoleClient();

  const probe = await supabase
    .from("dealership_billing")
    .select("dealership_id")
    .limit(1);

  if (
    probe.error &&
    !isMissingBillingTableError(probe.error.message, probe.error.code)
  ) {
    return { error: probe.error.message };
  }

  const billingInfraMissing =
    !!probe.error &&
    isMissingBillingTableError(probe.error.message, probe.error.code);

  if (billingInfraMissing) {
    const { error: dealershipErr } = await supabase
      .from("dealerships")
      .update({
        subscription_status,
        billing_notes: billing_notes.length > 0 ? billing_notes : null,
      })
      .eq("id", dealershipId);

    if (dealershipErr) {
      return { error: dealershipErr.message };
    }

    billingRevalidate(dealershipId);
    return {
      success: true,
      warning:
        "Neste projeto ainda não existem as tabelas de mensalidades (`dealership_billing`). Estado de cobrança e notas foram guardados só em `dealerships`.",
    };
  }

  const { error: dealershipErr } = await supabase
    .from("dealerships")
    .update({
      subscription_status,
      billing_notes: billing_notes.length > 0 ? billing_notes : null,
    })
    .eq("id", dealershipId);

  if (dealershipErr) {
    return { error: dealershipErr.message };
  }

  const { data: preserved } = await supabase
    .from("dealership_billing")
    .select("internal_notes")
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  const { error } = await supabase.from("dealership_billing").upsert(
    {
      dealership_id: dealershipId,
      monthly_amount,
      due_day,
      payment_method:
        payment_method.length > 0 ? payment_method : null,
      last_payment_date,
      agreement_status,
      contract_started_on,
      contract_ends_on,
      internal_notes:
        typeof preserved?.internal_notes === "string"
          ? preserved.internal_notes
          : null,
    },
    { onConflict: "dealership_id" },
  );

  if (error) {
    if (
      error.code === "42P01" ||
      isMissingBillingTableError(error.message, error.code)
    ) {
      return {
        error:
          "As tabelas de cobrança ainda não existem neste ambiente — aplique as migrações do hub.",
      };
    }
    if (
      error.message?.toLowerCase().includes("column") &&
      error.message?.toLowerCase().includes("does not exist")
    ) {
      return {
        error:
          "Faltam colunas novas neste projeto — aplique também `20260508103000_dealership_billing_contract_attachments.sql`.",
      };
    }
    return { error: error.message };
  }

  billingRevalidate(dealershipId);
  return { success: true };
}

export async function addDealershipBillingHistoryLineAction(
  dealershipId: string,
  formData: FormData,
): Promise<BillingActionResult> {
  await requireAdminSession();

  const billing_period_start = String(
    formData.get("history_period_start") ?? "",
  ).trim();
  const expected_amount = Number(
    String(formData.get("history_amount") ?? "").replace(",", "."),
  );
  const due_date_raw = String(formData.get("history_due_date") ?? "").trim();
  const settlement_status = String(formData.get("history_status") ?? "").trim();
  const paid_at_raw = String(formData.get("history_paid_at") ?? "").trim();
  const reference = String(formData.get("history_reference") ?? "").trim();
  const attachment = formData.get("history_attachment");

  if (!billing_period_start) {
    return {
      error: "Indique o mês de referência (início do período).",
    };
  }
  const period = new Date(billing_period_start);
  if (Number.isNaN(period.getTime())) {
    return { error: "Data de referência do período inválida." };
  }

  if (Number.isNaN(expected_amount) || expected_amount < 0) {
    return { error: "Valor da mensalidade inválido." };
  }

  if (!due_date_raw) {
    return { error: "Indique a data de vencimento." };
  }
  const dueDate = new Date(due_date_raw);
  if (Number.isNaN(dueDate.getTime())) {
    return { error: "Data de vencimento inválida." };
  }

  const statusOk =
    settlement_status === "paid" ||
    settlement_status === "pending" ||
    settlement_status === "overdue";
  if (!statusOk) {
    return { error: "Estado da linha inválido." };
  }

  let paid_at: string | null = null;
  if (paid_at_raw.length > 0) {
    const p = new Date(paid_at_raw);
    if (Number.isNaN(p.getTime())) {
      return { error: "Data de pagamento inválida." };
    }
    paid_at = p.toISOString();
  }

  const doc_kind_raw = String(formData.get("history_doc_kind") ?? "other").trim();
  const doc_kind: BillingSupportingDocKind =
    DOC_KINDS.has(doc_kind_raw as BillingSupportingDocKind)
      ? (doc_kind_raw as BillingSupportingDocKind)
      : "other";

  const supabase = createSupabaseServiceRoleClient();

  const { data: insertedRow, error: insertErr } = await supabase
    .from("dealership_billing_history")
    .insert({
      dealership_id: dealershipId,
      billing_period_start: period.toISOString().slice(0, 10),
      expected_amount,
      settlement_status,
      due_date: dueDate.toISOString().slice(0, 10),
      paid_at,
      reference: reference.length > 0 ? reference : null,
    })
    .select("id, supporting_documents")
    .single();

  if (insertErr) {
    if (
      insertErr.code === "42P01" ||
      isMissingBillingTableError(insertErr.message, insertErr.code)
    ) {
      return {
        error:
          "Tabela de mensalidades ainda não está preparada neste projeto — aplique as migrações do hub mais o pack de contrato/anexos.",
      };
    }
    if (insertErr.code === "23505") {
      return {
        error: "Já existe uma linha para este período nesta concessionária.",
      };
    }
    return { error: insertErr.message };
  }

  const historyId = insertedRow?.id;
  const fileUpload =
    attachment && typeof attachment === "object" && "size" in attachment
      ? (attachment as File)
      : null;
  let uploadErrorMessage: string | null = null;

  const historyRowIdRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const historyIdResolved =
    typeof historyId === "string" && historyRowIdRe.test(historyId) ?
      historyId
    : null;

  if (fileUpload && fileUpload.size > 0) {
    if (!historyIdResolved) {
      uploadErrorMessage = "Linha criada, mas falha persistente ao anexar ficheiro (ID não retornado).";
    } else {
      const validated = validateBillingAttachmentFile(fileUpload);
      if (!validated.ok) {
        uploadErrorMessage = validated.error ?? "Documento não aceite.";
      } else {
        const docId = crypto.randomUUID();
        const path = `${dealershipId}/${historyIdResolved}/${docId}_${safeDocumentBaseName(fileUpload.name)}`;
        const { error: upErr } = await supabase.storage
          .from(BILLING_DOCS_BUCKET)
          .upload(path, fileUpload, {
            contentType:
              fileUpload.type && fileUpload.type.length > 1
                ? fileUpload.type
                : validated.mime,
            upsert: false,
          });

        const prev = parseBillingSupportingDocuments(
          insertedRow?.supporting_documents,
        );
        if (upErr) {
          const msgLow = upErr.message.toLowerCase();
          uploadErrorMessage =
            msgLow.includes("bucket") && msgLow.includes("not")
              ? "Linha registada mas o cofre Storage `dealership-operator-billing` ainda não foi criado — confirme a migração."
              : `Anexo não enviado: ${upErr.message}`;
        } else {
          const meta = {
            id: docId,
            stored_path: path,
            original_name: fileUpload.name,
            doc_kind,
            uploaded_at: new Date().toISOString(),
          };
          const { error: metaErr } = await supabase
            .from("dealership_billing_history")
            .update({ supporting_documents: [...prev, meta] })
            .eq("id", historyIdResolved);

          if (metaErr) {
            uploadErrorMessage = `Ficheiro enviado mas metadados não gravados: ${metaErr.message}`;
            void supabase.storage.from(BILLING_DOCS_BUCKET).remove([path]);
          }
        }
      }
    }
  }

  billingRevalidate(dealershipId);
  if (uploadErrorMessage) {
    return { error: uploadErrorMessage };
  }
  return { success: true };
}

function validateBillingAttachmentFile(
  file: File,
): { ok: true; mime: string } | { ok: false; error: string } {
  if (file.size > MAX_BILLING_DOC_BYTES) {
    return {
      ok: false,
      error: "Cada documento deve ter no máximo 25 MB.",
    };
  }
  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_BILLING_DOC_MIME.has(mime)) {
    return {
      ok: false,
      error: "Formato não suportado. Use PDF, JPEG, PNG ou WebP.",
    };
  }
  return { ok: true, mime };
}

export async function uploadDealershipBillingHistoryDocumentAction(
  dealershipId: string,
  formData: FormData,
): Promise<BillingActionResult> {
  await requireAdminSession();

  const historyId = String(formData.get("history_id") ?? "").trim();
  const doc_kind_raw = String(formData.get("doc_kind") ?? "other").trim();
  const doc_kind: BillingSupportingDocKind =
    DOC_KINDS.has(doc_kind_raw as BillingSupportingDocKind)
      ? (doc_kind_raw as BillingSupportingDocKind)
      : "other";
  const attachment = formData.get("file");

  if (!historyId) {
    return { error: "Linha de histórico em falta." };
  }

  const file =
    attachment && typeof attachment === "object" && "size" in attachment
      ? (attachment as File)
      : null;
  if (!file || file.size === 0) {
    return { error: "Escolha um ficheiro para enviar." };
  }

  const validated = validateBillingAttachmentFile(file);
  if (!validated.ok) {
    return { error: validated.error ?? "Ficheiro inválido." };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: line, error: lineErr } = await supabase
    .from("dealership_billing_history")
    .select("id, dealership_id, supporting_documents")
    .eq("id", historyId)
    .maybeSingle();

  if (lineErr || !line || line.dealership_id !== dealershipId) {
    return { error: "Linha de mensalidade não encontrada." };
  }

  const docId = crypto.randomUUID();
  const path = `${dealershipId}/${historyId}/${docId}_${safeDocumentBaseName(file.name)}`;

  const { error: upErr } = await supabase.storage
    .from(BILLING_DOCS_BUCKET)
    .upload(path, file, {
      contentType:
        file.type && file.type.length > 1 ? file.type : validated.mime,
      upsert: false,
    });

  if (upErr) {
    if (
      upErr.message.toLowerCase().includes("bucket") &&
      upErr.message.toLowerCase().includes("not")
    ) {
      return {
        error:
          "O cofre Storage ainda não foi criado neste projeto — aplique a migração `20260508103000_dealership_billing_contract_attachments.sql`.",
      };
    }
    return { error: upErr.message };
  }

  const prev = parseBillingSupportingDocuments(line.supporting_documents);
  const meta = {
    id: docId,
    stored_path: path,
    original_name: file.name,
    doc_kind,
    uploaded_at: new Date().toISOString(),
  };

  const { error: metaErr } = await supabase
    .from("dealership_billing_history")
    .update({ supporting_documents: [...prev, meta] })
    .eq("id", historyId);

  if (metaErr) {
    void supabase.storage.from(BILLING_DOCS_BUCKET).remove([path]);
    return { error: metaErr.message };
  }

  billingRevalidate(dealershipId);
  return { success: true };
}

export async function deleteDealershipBillingHistoryDocumentAction(
  dealershipId: string,
  formData: FormData,
): Promise<BillingActionResult> {
  await requireAdminSession();

  const historyId = String(formData.get("history_id") ?? "").trim();
  const documentId = String(formData.get("document_id") ?? "").trim();

  if (!historyId || !documentId) {
    return { error: "Referência incompleta." };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: line, error: lineErr } = await supabase
    .from("dealership_billing_history")
    .select("id, dealership_id, supporting_documents")
    .eq("id", historyId)
    .maybeSingle();

  if (lineErr || !line || line.dealership_id !== dealershipId) {
    return { error: "Linha de mensalidade não encontrada." };
  }

  const prev = parseBillingSupportingDocuments(line.supporting_documents);
  const victim = prev.find((d) => d.id === documentId);
  const next = prev.filter((d) => d.id !== documentId);
  if (!victim) {
    return { error: "Documento não encontrado." };
  }

  const { error: updErr } = await supabase
    .from("dealership_billing_history")
    .update({ supporting_documents: next })
    .eq("id", historyId);

  if (updErr) {
    return { error: updErr.message };
  }

  const { error: rmErr } = await supabase.storage
    .from(BILLING_DOCS_BUCKET)
    .remove([victim.stored_path]);

  if (rmErr) {
    return {
      error: `Metadados removidos, mas falha ao apagar ficheiro: ${rmErr.message}`,
    };
  }

  billingRevalidate(dealershipId);
  return { success: true };
}

export async function getDealershipBillingDocumentSignedUrlAction(
  dealershipId: string,
  storedPath: string,
): Promise<BillingActionResult> {
  await requireAdminSession();

  const path = storedPath.trim();
  if (!path || path.includes("..")) {
    return { error: "Caminho inválido." };
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length < 3 || segments[0] !== dealershipId) {
    return { error: "Documento não pertence a esta concessionária." };
  }

  const historyId = segments[1];
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRe.test(historyId)) {
    return { error: "Referência do registo inválida." };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: line, error: lineErr } = await supabase
    .from("dealership_billing_history")
    .select("id, dealership_id, supporting_documents")
    .eq("id", historyId)
    .maybeSingle();

  if (lineErr || !line || line.dealership_id !== dealershipId) {
    return { error: "Registo não encontrado." };
  }

  const docs = parseBillingSupportingDocuments(line.supporting_documents);
  if (!docs.some((d) => d.stored_path === path)) {
    return { error: "Documento não associado a este registo." };
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(BILLING_DOCS_BUCKET)
    .createSignedUrl(path, 600);

  if (signErr || !signed?.signedUrl) {
    return {
      error:
        signErr?.message ??
        "Não foi possível gerar o link temporário de descarga.",
    };
  }

  return { success: true, signedUrl: signed.signedUrl };
}
