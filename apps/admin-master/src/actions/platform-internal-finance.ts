"use server";

import { revalidatePath } from "next/cache";

import {
  PLATFORM_EXPENSE_CATEGORIES,
  PLATFORM_REVENUE_CATEGORIES,
  type PlatformExpenseCategory,
  type PlatformRevenueCategory,
} from "@autopainel/shared/types";

import { requireAdminSession } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const REVALIDATE_PATH = "/painel/financeiro";

interface ActionResult {
  error?: string;
  success?: boolean;
}

function parseMoneyInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.round(value * 100) / 100;
}

function parseReferenceMonth(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^\d{4}-\d{2}$/.test(trimmed)) {
    return null;
  }
  return `${trimmed}-01`;
}

function parseOptionalDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

function isRevenueCategory(value: string): value is PlatformRevenueCategory {
  return (PLATFORM_REVENUE_CATEGORIES as readonly string[]).includes(value);
}

function isExpenseCategory(value: string): value is PlatformExpenseCategory {
  return (PLATFORM_EXPENSE_CATEGORIES as readonly string[]).includes(value);
}

export async function createPlatformRevenueEntryAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const referenceMonth = parseReferenceMonth(String(formData.get("reference_month") ?? ""));
  const categoryRaw = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const amount = parseMoneyInput(String(formData.get("amount") ?? ""));
  const recognizedAt =
    parseOptionalDate(String(formData.get("recognized_at") ?? "")) ??
    referenceMonth?.slice(0, 10) ??
    null;

  if (!referenceMonth) {
    return { error: "Informe a competência (AAAA-MM)." };
  }
  if (!isRevenueCategory(categoryRaw)) {
    return { error: "Categoria de receita inválida." };
  }
  if (description.length < 2) {
    return { error: "Descreva a receita (mínimo 2 caracteres)." };
  }
  if (amount === null) {
    return { error: "Informe um valor válido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("platform_revenue_entries").insert({
    reference_month: referenceMonth,
    category: categoryRaw,
    amount,
    description,
    recognized_at: recognizedAt,
  });

  if (error) {
    return { error: "Não foi possível cadastrar a receita." };
  }

  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

export async function createPlatformExpenseEntryAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const referenceMonth = parseReferenceMonth(String(formData.get("reference_month") ?? ""));
  const categoryRaw = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const vendorName = String(formData.get("vendor_name") ?? "").trim();
  const amount = parseMoneyInput(String(formData.get("amount") ?? ""));
  const paidAt = parseOptionalDate(String(formData.get("paid_at") ?? ""));

  if (!referenceMonth) {
    return { error: "Informe a competência (AAAA-MM)." };
  }
  if (!isExpenseCategory(categoryRaw)) {
    return { error: "Categoria de despesa inválida." };
  }
  if (description.length < 2) {
    return { error: "Descreva a despesa (mínimo 2 caracteres)." };
  }
  if (amount === null) {
    return { error: "Informe um valor válido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("platform_expense_entries").insert({
    reference_month: referenceMonth,
    category: categoryRaw,
    amount,
    description,
    vendor_name: vendorName.length > 0 ? vendorName : null,
    paid_at: paidAt,
  });

  if (error) {
    return { error: "Não foi possível cadastrar a despesa." };
  }

  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

export async function deletePlatformRevenueEntryAction(entryId: string): Promise<ActionResult> {
  await requireAdminSession();

  if (!entryId.trim()) {
    return { error: "Registro inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("platform_revenue_entries")
    .delete()
    .eq("id", entryId.trim());

  if (error) {
    return { error: "Não foi possível excluir a receita." };
  }

  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}

export async function deletePlatformExpenseEntryAction(entryId: string): Promise<ActionResult> {
  await requireAdminSession();

  if (!entryId.trim()) {
    return { error: "Registro inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("platform_expense_entries")
    .delete()
    .eq("id", entryId.trim());

  if (error) {
    return { error: "Não foi possível excluir a despesa." };
  }

  revalidatePath(REVALIDATE_PATH);
  return { success: true };
}
