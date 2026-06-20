"use server";

import { revalidatePath } from "next/cache";

import { requireAdminOrOwnSalesRep } from "@/lib/auth/require-sales-rep";
import { requireAdminSession } from "@/lib/auth/require-admin";
import {
  isPaymentMethod,
  isSalesRepStatus,
  parseCommissionRatePercentToBps,
} from "@/lib/data/platform-sales-squad-shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const REVALIDATE_PATHS = [
  "/painel/equipe/comercial",
  "/painel/comercial/extrato",
  "/painel/comercial/dados-pagamento",
];

interface ActionResult {
  error?: string;
  success?: boolean;
  salesRepId?: string;
}

function revalidateCommercialPaths() {
  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export async function createPlatformSalesRepAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const documentCpf = digitsOnly(String(formData.get("document_cpf") ?? ""));
  const statusRaw = String(formData.get("status") ?? "onboarding").trim();
  const hireDate = String(formData.get("hire_date") ?? "").trim() || null;
  const commissionRateRaw = String(
    formData.get("default_commission_rate_percent") ?? "10",
  ).trim();
  const userId = String(formData.get("user_id") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (fullName.length < 2) {
    return { error: "Informe o nome completo do representante." };
  }
  if (!email.includes("@")) {
    return { error: "Informe um e-mail válido." };
  }
  if (!isSalesRepStatus(statusRaw)) {
    return { error: "Status inválido." };
  }
  const defaultCommissionRateBps = parseCommissionRatePercentToBps(commissionRateRaw);
  if (defaultCommissionRateBps === null) {
    return { error: "Informe uma comissão padrão entre 0% e 100%." };
  }
  if (documentCpf.length > 0 && documentCpf.length !== 11) {
    return { error: "CPF inválido — informe 11 dígitos." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("platform_sales_reps")
    .insert({
      full_name: fullName,
      email,
      phone: phone || null,
      document_cpf: documentCpf || null,
      status: statusRaw,
      hire_date: hireDate,
      default_commission_rate_bps: defaultCommissionRateBps,
      user_id: userId,
      notes,
    })
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { error: "Já existe um representante com este e-mail." };
    }
    return { error: "Não foi possível cadastrar o representante." };
  }

  revalidateCommercialPaths();
  return { success: true, salesRepId: data.id as string };
}

export async function updatePlatformSalesRepAction(
  salesRepId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  if (!salesRepId) {
    return { error: "Representante inválido." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const documentCpf = digitsOnly(String(formData.get("document_cpf") ?? ""));
  const statusRaw = String(formData.get("status") ?? "active").trim();
  const hireDate = String(formData.get("hire_date") ?? "").trim() || null;
  const terminationDate =
    String(formData.get("termination_date") ?? "").trim() || null;
  const commissionRateRaw = String(
    formData.get("default_commission_rate_percent") ?? "",
  ).trim();
  const userId = String(formData.get("user_id") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (fullName.length < 2) {
    return { error: "Informe o nome completo do representante." };
  }
  if (!email.includes("@")) {
    return { error: "Informe um e-mail válido." };
  }
  if (!isSalesRepStatus(statusRaw)) {
    return { error: "Status inválido." };
  }
  const defaultCommissionRateBps = parseCommissionRatePercentToBps(commissionRateRaw);
  if (defaultCommissionRateBps === null) {
    return { error: "Informe uma comissão padrão entre 0% e 100%." };
  }
  if (documentCpf.length > 0 && documentCpf.length !== 11) {
    return { error: "CPF inválido — informe 11 dígitos." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("platform_sales_reps")
    .update({
      full_name: fullName,
      email,
      phone: phone || null,
      document_cpf: documentCpf || null,
      status: statusRaw,
      hire_date: hireDate,
      termination_date: terminationDate,
      default_commission_rate_bps: defaultCommissionRateBps,
      user_id: userId,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", salesRepId);

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um representante com este e-mail." };
    }
    return { error: "Não foi possível atualizar o representante." };
  }

  revalidateCommercialPaths();
  return { success: true, salesRepId };
}

export async function deactivatePlatformSalesRepAction(
  salesRepId: string,
): Promise<ActionResult> {
  await requireAdminSession();

  if (!salesRepId) {
    return { error: "Representante inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("platform_sales_reps")
    .update({
      status: "inactive",
      termination_date: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("id", salesRepId);

  if (error) {
    return { error: "Não foi possível inativar o representante." };
  }

  revalidateCommercialPaths();
  return { success: true };
}

export async function upsertPlatformSalesRepBankAccountAction(
  formData: FormData,
): Promise<ActionResult> {
  const salesRepId = String(formData.get("sales_rep_id") ?? "").trim();
  const accountId = String(formData.get("account_id") ?? "").trim() || null;

  if (!salesRepId) {
    return { error: "Representante inválido." };
  }

  await requireAdminOrOwnSalesRep(salesRepId);

  const paymentMethodRaw = String(formData.get("payment_method") ?? "pix").trim();
  const pixKeyType = String(formData.get("pix_key_type") ?? "").trim() || null;
  const pixKey = String(formData.get("pix_key") ?? "").trim() || null;
  const bankCode = String(formData.get("bank_code") ?? "").trim() || null;
  const branch = String(formData.get("branch") ?? "").trim() || null;
  const accountNumber = String(formData.get("account_number") ?? "").trim() || null;
  const accountHolderName = String(formData.get("account_holder_name") ?? "").trim();
  const accountHolderDocument = digitsOnly(
    String(formData.get("account_holder_document") ?? ""),
  );
  const isPrimary = String(formData.get("is_primary") ?? "true") === "true";

  if (!isPaymentMethod(paymentMethodRaw)) {
    return { error: "Forma de pagamento inválida." };
  }
  if (accountHolderName.length < 2) {
    return { error: "Informe o nome do titular da conta." };
  }
  if (accountHolderDocument.length < 11) {
    return { error: "Informe o CPF ou CNPJ do titular." };
  }
  if (paymentMethodRaw === "pix" && (!pixKey || pixKey.length < 3)) {
    return { error: "Informe a chave PIX." };
  }
  if (
    paymentMethodRaw === "ted" &&
    (!bankCode || !branch || !accountNumber)
  ) {
    return { error: "Informe banco, agência e conta para TED." };
  }

  const supabase = await createSupabaseServerClient();

  if (isPrimary) {
    await supabase
      .from("platform_sales_rep_bank_accounts")
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq("sales_rep_id", salesRepId);
  }

  const payload = {
    sales_rep_id: salesRepId,
    payment_method: paymentMethodRaw,
    pix_key_type: paymentMethodRaw === "pix" ? pixKeyType : null,
    pix_key: paymentMethodRaw === "pix" ? pixKey : null,
    bank_code: paymentMethodRaw === "ted" ? bankCode : null,
    branch: paymentMethodRaw === "ted" ? branch : null,
    account_number: paymentMethodRaw === "ted" ? accountNumber : null,
    account_holder_name: accountHolderName,
    account_holder_document: accountHolderDocument,
    is_primary: isPrimary,
    updated_at: new Date().toISOString(),
  };

  if (accountId) {
    const { error } = await supabase
      .from("platform_sales_rep_bank_accounts")
      .update(payload)
      .eq("id", accountId)
      .eq("sales_rep_id", salesRepId);

    if (error) {
      return { error: "Não foi possível atualizar os dados de pagamento." };
    }
  } else {
    const { error } = await supabase
      .from("platform_sales_rep_bank_accounts")
      .insert(payload);

    if (error) {
      return { error: "Não foi possível salvar os dados de pagamento." };
    }
  }

  revalidateCommercialPaths();
  return { success: true, salesRepId };
}
