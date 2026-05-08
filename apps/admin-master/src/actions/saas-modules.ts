"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { requireAdminSession } from "@/lib/auth/require-admin";

import type { ActionResult } from "./dealerships";

const REVALIDATE_MODULE_PATHS = [
  "/painel/modulos",
  "/painel/modulos/nova",
  "/painel/planos",
  "/painel/concessionarias",
];

const MODULE_KEY_RE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

export async function createSaasModuleAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const rawKey = String(formData.get("key") ?? "").trim().toLowerCase();
  const display_name = String(formData.get("display_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortRaw = String(formData.get("sort_order") ?? "0").trim();
  const sort_order = Number.parseInt(sortRaw, 10);
  const is_active =
    formData.get("is_active") === "on" ||
    formData.get("is_active") === "true" ||
    formData.get("is_active") === "1";

  if (!MODULE_KEY_RE.test(rawKey)) {
    return {
      error:
        "Chave inválida: use snake_case com letras minúsculas (ex.: relatorios_extra).",
    };
  }

  if (display_name.length < 2) {
    return { error: "Nome de apresentação deve ter pelo menos 2 caracteres." };
  }

  if (Number.isNaN(sort_order) || sort_order < 0 || sort_order > 9999) {
    return {
      error: "Ordem inválida: informe um inteiro entre 0 e 9999.",
    };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { error } = await supabase.from("saas_modules").insert({
    key: rawKey,
    display_name,
    description: description.length > 0 ? description : null,
    sort_order,
    is_active,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um módulo com esta chave." };
    }
    return { error: error.message };
  }

  REVALIDATE_MODULE_PATHS.forEach((p) => revalidatePath(p));
  return { success: true };
}

export async function updateSaasModuleAction(
  moduleId: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(moduleId)) {
    return { error: "Identificador do módulo inválido." };
  }

  const display_name = String(formData.get("display_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortRaw = String(formData.get("sort_order") ?? "0").trim();
  const sort_order = Number.parseInt(sortRaw, 10);
  const is_active =
    formData.get("is_active") === "on" ||
    formData.get("is_active") === "true" ||
    formData.get("is_active") === "1";

  if (display_name.length < 2) {
    return { error: "Nome de apresentação deve ter pelo menos 2 caracteres." };
  }
  if (Number.isNaN(sort_order) || sort_order < 0 || sort_order > 9999) {
    return {
      error: "Ordem inválida: informe um inteiro entre 0 e 9999.",
    };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { error } = await supabase
    .from("saas_modules")
    .update({
      display_name,
      description: description.length > 0 ? description : null,
      sort_order,
      is_active,
    })
    .eq("id", moduleId);

  if (error) {
    return { error: error.message };
  }

  REVALIDATE_MODULE_PATHS.forEach((p) => revalidatePath(p));
  return { success: true };
}
