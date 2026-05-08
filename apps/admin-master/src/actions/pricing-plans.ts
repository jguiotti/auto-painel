"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { requireAdminSession } from "@/lib/auth/require-admin";

import type { ActionResult } from "./dealerships";

const PLAN_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const REVALIDATE_PLAN_PATHS = [
  "/painel/planos",
  "/painel/modulos",
  "/painel/concessionarias",
  "/painel/financeiro",
];

function parseMoney(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(normalized);
  if (Number.isNaN(n) || n < 0) {
    return null;
  }
  return Math.round(n * 100) / 100;
}

function parseModuleIds(formData: FormData): string[] {
  const raw = formData.getAll("module_ids");
  const out: string[] = [];
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const entry of raw) {
    const s = typeof entry === "string" ? entry.trim() : "";
    if (uuid.test(s)) {
      out.push(s);
    }
  }
  return [...new Set(out)];
}

export async function createPricingPlanAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price_amount") ?? "").trim();
  const currency_code = String(formData.get("currency_code") ?? "BRL")
    .trim()
    .toUpperCase()
    .slice(0, 3);
  const is_active =
    formData.get("is_active") === "on" ||
    formData.get("is_active") === "true" ||
    formData.get("is_active") === "1";

  if (name.length < 2) {
    return { error: "Nome do plano deve ter pelo menos 2 caracteres." };
  }
  if (!PLAN_SLUG_RE.test(slug)) {
    return {
      error:
        "Slug inválido: use letras minúsculas, números e hífens (ex.: plano-baixada).",
    };
  }
  const price_amount = parseMoney(priceRaw);
  if (price_amount === null) {
    return { error: "Preço inválido. Informe um valor numérico ≥ 0." };
  }
  if (!/^[A-Z]{3}$/.test(currency_code)) {
    return { error: "Moeda inválida (use código ISO de 3 letras, ex.: BRL)." };
  }

  const module_ids = parseModuleIds(formData);

  const supabase = createSupabaseServiceRoleClient();

  const { data: inserted, error: insertErr } = await supabase
    .from("pricing_plans")
    .insert({
      slug,
      name,
      description: description.length > 0 ? description : null,
      price_amount,
      currency_code,
      is_active,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    if (
      insertErr?.message?.includes("unique") ||
      insertErr?.code === "23505"
    ) {
      return { error: "Já existe um plano com este slug." };
    }
    return {
      error: insertErr?.message ?? "Não foi possível criar o plano.",
    };
  }

  const planId = inserted.id as string;

  if (module_ids.length > 0) {
    const rows = module_ids.map((module_id) => ({
      pricing_plan_id: planId,
      module_id,
    }));
    const { error: pivotErr } = await supabase
      .from("pricing_plan_modules")
      .insert(rows);

    if (pivotErr) {
      await supabase.from("pricing_plans").delete().eq("id", planId);
      return {
        error:
          pivotErr.message ??
          "Não foi possível associar os módulos ao novo plano.",
      };
    }
  }

  REVALIDATE_PLAN_PATHS.forEach((p) => revalidatePath(p));
  return { success: true };
}

export async function updatePricingPlanAction(
  planId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(planId)) {
    return { error: "Identificador do plano inválido." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceRaw = String(formData.get("price_amount") ?? "").trim();
  const currency_code = String(formData.get("currency_code") ?? "BRL")
    .trim()
    .toUpperCase()
    .slice(0, 3);
  const is_active =
    formData.get("is_active") === "on" ||
    formData.get("is_active") === "true" ||
    formData.get("is_active") === "1";

  if (name.length < 2) {
    return { error: "Nome do plano deve ter pelo menos 2 caracteres." };
  }
  const price_amount = parseMoney(priceRaw);
  if (price_amount === null) {
    return { error: "Preço inválido. Informe um valor numérico ≥ 0." };
  }
  if (!/^[A-Z]{3}$/.test(currency_code)) {
    return { error: "Moeda inválida (use código ISO de 3 letras, ex.: BRL)." };
  }

  const module_ids = parseModuleIds(formData);

  const supabase = createSupabaseServiceRoleClient();

  const { error: updErr } = await supabase
    .from("pricing_plans")
    .update({
      name,
      description: description.length > 0 ? description : null,
      price_amount,
      currency_code,
      is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId);

  if (updErr) {
    return { error: updErr.message };
  }

  const { error: delErr } = await supabase
    .from("pricing_plan_modules")
    .delete()
    .eq("pricing_plan_id", planId);

  if (delErr) {
    return { error: delErr.message };
  }

  if (module_ids.length > 0) {
    const rows = module_ids.map((module_id) => ({
      pricing_plan_id: planId,
      module_id,
    }));
    const { error: pivotErr } = await supabase
      .from("pricing_plan_modules")
      .insert(rows);

    if (pivotErr) {
      return {
        error:
          pivotErr.message ??
          "Plano atualizado, mas falhou ao gravar os módulos. Revise no Supabase.",
      };
    }
  }

  REVALIDATE_PLAN_PATHS.forEach((p) => revalidatePath(p));
  return { success: true };
}

export async function deletePricingPlanAction(planId: string): Promise<ActionResult> {
  await requireAdminSession();

  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(planId)) {
    return { error: "Identificador do plano inválido." };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { error } = await supabase.from("pricing_plans").delete().eq("id", planId);

  if (error) {
    return { error: error.message };
  }

  REVALIDATE_PLAN_PATHS.forEach((p) => revalidatePath(p));
  return { success: true };
}
