"use server";

import { revalidatePath } from "next/cache";

import { parseHqAddressFromForm } from "@autopainel/shared/lib/dealership/parse-hq-address-from-form";
import { inviteDealershipCollaborator } from "@autopainel/shared/lib/auth/invite-dealership-collaborator";
import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";
import { uploadEmployeePhoto } from "@/lib/team/upload-employee-photo";

export interface TeamActionResult {
  error?: string;
  success?: boolean;
  passwordResetEmailSent?: boolean;
}

function canManageTeamAsOwner(role: string): boolean {
  return role === "owner" || role === "super_admin";
}

export async function upsertEmployeeProfileAction(
  userId: string,
  formData: FormData,
): Promise<TeamActionResult> {
  const { supabase, profile, dealershipId } = await requireDashboardSession(
    "/painel/equipe",
  );

  if (!canManageTeamAsOwner(profile.role)) {
    return { error: "Apenas o titular da loja pode editar a equipe." };
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

  let photoUrl = String(formData.get("photo_url") ?? "").trim() || null;
  const photoFile = formData.get("photo_file");
  if (photoFile instanceof File && photoFile.size > 0) {
    let admin;
    try {
      admin = createSupabaseServiceRoleClient();
    } catch {
      return { error: "Não foi possível enviar a foto. Tente novamente em instantes." };
    }

    const uploaded = await uploadEmployeePhoto(admin, {
      dealershipId,
      userId,
      file: photoFile,
    });
    if ("error" in uploaded) {
      return { error: uploaded.error };
    }
    photoUrl = uploaded.url;
  }

  const { error } = await supabase.rpc("upsert_dealership_employee_profile", {
    p_user_id: userId,
    p_full_name: fullName,
    p_phone: String(formData.get("phone") ?? "").trim() || null,
    p_cpf: String(formData.get("cpf") ?? "").trim() || null,
    p_rg: String(formData.get("rg") ?? "").trim() || null,
    p_photo_url: photoUrl,
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

export async function inviteTeamMemberAction(formData: FormData): Promise<TeamActionResult> {
  try {
    const { profile, dealershipId } = await requireDashboardSession("/painel/equipe");

    if (!canManageTeamAsOwner(profile.role)) {
      return { error: "Apenas o titular da loja pode convidar colaboradores." };
    }

    const email = String(formData.get("email") ?? "").trim();
    const fullName = String(formData.get("full_name") ?? "").trim();
    const roleRaw = String(formData.get("role") ?? "seller").trim();

    if (roleRaw !== "seller" && roleRaw !== "manager") {
      return { error: "Papel inválido para convite pelo painel da loja." };
    }

    let admin;
    try {
      admin = createSupabaseServiceRoleClient();
    } catch {
      return {
        error:
          "Convite indisponível no momento. Fale com o suporte AutoPainel ou peça ao admin da plataforma para adicionar a pessoa.",
      };
    }

    const { data: dealership, error: dealershipError } = await admin
      .from("dealerships")
      .select("slug")
      .eq("id", dealershipId)
      .maybeSingle();

    if (dealershipError || !dealership?.slug) {
      return { error: "Não foi possível carregar os dados da loja." };
    }

    const result = await inviteDealershipCollaborator(admin, {
      email,
      fullName,
      role: roleRaw,
      dealershipId,
      dealershipSlug: String(dealership.slug),
    });

    if (result.error) {
      return { error: result.error };
    }

    revalidatePath("/painel/equipe");
    revalidatePath("/painel");
    return {
      success: true,
      passwordResetEmailSent: result.passwordResetEmailSent,
    };
  } catch {
    return {
      error: "Não foi possível concluir o convite. Tente novamente em instantes.",
    };
  }
}
