"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { requireAdminSession } from "@/lib/auth/require-admin";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

function parseThemeSettings(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
}

function mergeBrandColors(
  base: Record<string, unknown>,
  primary: string,
  primaryForeground: string,
): Record<string, unknown> {
  return {
    ...base,
    primary,
    primaryForeground,
  };
}

export async function createDealershipAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const customDomain = String(formData.get("custom_domain") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp_number") ?? "").trim();
  const primary = String(formData.get("primary_color") ?? "").trim();
  const primaryFg = String(formData.get("primary_foreground") ?? "").trim();
  const status = String(formData.get("status") ?? "pending_setup").trim();

  if (name.length < 2) {
    return { error: "Nome da concessionária é obrigatório." };
  }
  if (!SLUG_RE.test(slug)) {
    return {
      error:
        "Subdomínio inválido. Use letras minúsculas, números e hífens (ex.: minha-loja).",
    };
  }
  if (!HEX_RE.test(primary) || !HEX_RE.test(primaryFg)) {
    return { error: "Cores devem estar no formato #RRGGBB." };
  }

  const allowedStatus = new Set([
    "active",
    "suspended",
    "pending_setup",
    "churned",
  ]);
  if (!allowedStatus.has(status)) {
    return { error: "Status inválido." };
  }

  const supabase = createSupabaseServiceRoleClient();

  const theme_settings = mergeBrandColors({}, primary, primaryFg);

  const { error } = await supabase.from("dealerships").insert({
    name,
    slug,
    custom_domain: customDomain.length > 0 ? customDomain : null,
    contact_email: contactEmail.length > 0 ? contactEmail : null,
    whatsapp_number: whatsapp.length > 0 ? whatsapp : null,
    theme_settings,
    status,
    subscription_plan: "trial",
    subscription_status: "trialing",
    subscription_current_period_end: null,
  });

  if (error) {
    if (error.message.includes("unique") || error.code === "23505") {
      return { error: "Este subdomínio ou domínio já está em uso." };
    }
    return { error: error.message };
  }

  revalidatePath("/concessionarias");
  revalidatePath("/dashboard");
  revalidatePath("/financeiro");
  return { success: true };
}

export async function updateDealershipAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const customDomain = String(formData.get("custom_domain") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp_number") ?? "").trim();
  const primary = String(formData.get("primary_color") ?? "").trim();
  const primaryFg = String(formData.get("primary_foreground") ?? "").trim();
  const status = String(formData.get("status") ?? "active").trim();

  if (name.length < 2 || !SLUG_RE.test(slug)) {
    return { error: "Dados inválidos." };
  }
  if (!HEX_RE.test(primary) || !HEX_RE.test(primaryFg)) {
    return { error: "Cores devem estar no formato #RRGGBB." };
  }

  const allowedStatus = new Set([
    "active",
    "suspended",
    "pending_setup",
    "churned",
  ]);
  if (!allowedStatus.has(status)) {
    return { error: "Status inválido." };
  }

  const supabase = createSupabaseServiceRoleClient();

  const { data: existing, error: loadErr } = await supabase
    .from("dealerships")
    .select("theme_settings")
    .eq("id", id)
    .single();

  if (loadErr || !existing) {
    return { error: "Concessionária não encontrada." };
  }

  const theme_settings = mergeBrandColors(
    parseThemeSettings(existing.theme_settings),
    primary,
    primaryFg,
  );

  const { error } = await supabase
    .from("dealerships")
    .update({
      name,
      slug,
      custom_domain: customDomain.length > 0 ? customDomain : null,
      contact_email: contactEmail.length > 0 ? contactEmail : null,
      whatsapp_number: whatsapp.length > 0 ? whatsapp : null,
      theme_settings,
      status,
    })
    .eq("id", id);

  if (error) {
    if (error.message.includes("unique") || error.code === "23505") {
      return { error: "Este subdomínio ou domínio já está em uso." };
    }
    return { error: error.message };
  }

  revalidatePath("/concessionarias");
  revalidatePath("/dashboard");
  revalidatePath("/financeiro");
  return { success: true };
}

export async function deleteDealershipAction(id: string): Promise<ActionResult> {
  await requireAdminSession();
  const supabase = createSupabaseServiceRoleClient();

  const { error } = await supabase.from("dealerships").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/concessionarias");
  revalidatePath("/dashboard");
  revalidatePath("/financeiro");
  return { success: true };
}
