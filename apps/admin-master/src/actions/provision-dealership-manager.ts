"use server";

import { requireAdminSession } from "@/lib/auth/require-admin";

export interface ProvisionResult {
  error?: string;
  success?: boolean;
  temporary_password?: string;
  user_id?: string;
  email?: string;
}

export async function provisionDealershipManagerAction(
  formData: FormData,
): Promise<ProvisionResult> {
  await requireAdminSession();

  const secret = process.env.ADMIN_PROVISION_FUNCTION_SECRET ?? "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  if (!secret || secret.length < 8) {
    return {
      error:
        "Configure ADMIN_PROVISION_FUNCTION_SECRET (mesmo valor que PROVISION_FUNCTION_SECRET na Edge Function).",
    };
  }
  if (!supabaseUrl) {
    return { error: "NEXT_PUBLIC_SUPABASE_URL ausente." };
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const dealershipId = String(formData.get("dealership_id") ?? "").trim();

  if (!email || !fullName || !dealershipId) {
    return { error: "Preencha e-mail, nome e concessionária." };
  }

  const url = `${supabaseUrl.replace(/\/$/, "")}/functions/v1/provision-dealership-user`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-provision-key": secret,
      },
      body: JSON.stringify({
        email,
        full_name: fullName,
        dealership_id: dealershipId,
      }),
    });
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Falha ao chamar a função de provisionamento.",
    };
  }

  const json = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    return {
      error: typeof json.error === "string" ? json.error : `Erro HTTP ${res.status}`,
    };
  }

  return {
    success: true,
    user_id: typeof json.user_id === "string" ? json.user_id : undefined,
    email: typeof json.email === "string" ? json.email : email,
    temporary_password:
      typeof json.temporary_password === "string" ? json.temporary_password : undefined,
  };
}
