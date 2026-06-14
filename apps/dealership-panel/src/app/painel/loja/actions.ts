"use server";

import { revalidatePath } from "next/cache";

import {
  digitsOnly,
} from "@autopainel/shared/lib/br/format-input-masks";
import {
  mergeHqAddressIntoContentConfig,
  parseHqAddressFromForm,
} from "@autopainel/shared/lib/dealership/parse-hq-address-from-form";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

export interface StoreSettingsActionResult {
  error?: string;
  success?: boolean;
}

function canManageStoreSettings(role: string): boolean {
  return role === "owner" || role === "manager" || role === "super_admin";
}

function parseRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as Record<string, unknown>;
}

export async function updateDealershipStoreSettingsAction(
  formData: FormData,
): Promise<StoreSettingsActionResult> {
  const { supabase, profile, dealershipId } = await requireDashboardSession(
    "/painel/loja",
  );

  if (!canManageStoreSettings(profile.role)) {
    return { error: "Apenas gestores podem alterar os dados da loja." };
  }

  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const whatsappRaw = String(formData.get("whatsapp_number") ?? "").trim();
  const whatsappDigits = digitsOnly(whatsappRaw);

  const emailNorm = contactEmail.toLowerCase();
  if (emailNorm && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return { error: "Informe um e-mail válido." };
  }

  if (whatsappDigits && (whatsappDigits.length < 10 || whatsappDigits.length > 13)) {
    return { error: "Informe um WhatsApp válido com DDD." };
  }

  const { data: existing, error: loadError } = await supabase
    .from("dealerships")
    .select("content_config")
    .eq("id", dealershipId)
    .single();

  if (loadError || !existing) {
    return { error: "Não foi possível carregar os dados da loja." };
  }

  const hqAddress = parseHqAddressFromForm(formData, "hq");
  const contentConfig = mergeHqAddressIntoContentConfig(
    parseRecord(existing.content_config),
    hqAddress,
  );

  const { error } = await supabase
    .from("dealerships")
    .update({
      contact_email: emailNorm || null,
      whatsapp_number: whatsappDigits || null,
      content_config: contentConfig,
    })
    .eq("id", dealershipId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/painel/loja");
  revalidatePath("/painel");
  return { success: true };
}
