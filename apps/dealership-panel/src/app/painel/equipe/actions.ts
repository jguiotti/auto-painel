"use server";

import { revalidatePath } from "next/cache";

import { parseHqAddressFromForm } from "@autopainel/shared/lib/dealership/parse-hq-address-from-form";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";

export interface TeamActionResult {
  error?: string;
  success?: boolean;
}

function canManageTeam(role: string): boolean {
  return role === "owner" || role === "manager" || role === "super_admin";
}

export async function upsertEmployeeProfileAction(
  userId: string,
  formData: FormData,
): Promise<TeamActionResult> {
  const { supabase, profile, dealershipId } = await requireDashboardSession(
    "/painel/equipe",
  );

  if (!canManageTeam(profile.role)) {
    return { error: "Apenas gestores podem editar a equipe." };
  }

  const fullName = String(formData.get("full_name") ?? "").trim();
  const baseSalaryRaw = String(formData.get("base_salary") ?? "").trim();
  const commissionPercentRaw = String(formData.get("commission_percent") ?? "").trim();
  const commissionFixedRaw = String(
    formData.get("commission_fixed_per_vehicle") ?? "",
  ).trim();
  const isActive = String(formData.get("is_active") ?? "true") !== "false";

  const baseSalary = baseSalaryRaw ? Number(baseSalaryRaw.replace(",", ".")) : null;
  const commissionPercent = commissionPercentRaw
    ? Number(commissionPercentRaw.replace(",", "."))
    : null;
  const commissionFixed = commissionFixedRaw
    ? Number(commissionFixedRaw.replace(",", "."))
    : null;

  const address = parseHqAddressFromForm(formData, "emp");

  const { error } = await supabase.rpc("upsert_dealership_employee_profile", {
    p_user_id: userId,
    p_full_name: fullName,
    p_phone: String(formData.get("phone") ?? "").trim() || null,
    p_cpf: String(formData.get("cpf") ?? "").trim() || null,
    p_rg: String(formData.get("rg") ?? "").trim() || null,
    p_photo_url: String(formData.get("photo_url") ?? "").trim() || null,
    p_address: address,
    p_base_salary: Number.isFinite(baseSalary) ? baseSalary : null,
    p_commission_percent: Number.isFinite(commissionPercent)
      ? commissionPercent
      : null,
    p_commission_fixed_per_vehicle: Number.isFinite(commissionFixed)
      ? commissionFixed
      : null,
    p_is_active: isActive,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/painel/equipe");
  revalidatePath("/painel/conta/perfil");
  revalidatePath("/painel");
  return { success: true };
}
