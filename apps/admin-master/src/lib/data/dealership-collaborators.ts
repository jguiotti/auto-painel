import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

export interface DealershipCollaboratorRow {
  id: string;
  role: "owner" | "manager" | "seller";
  email: string | null;
  full_name: string | null;
}

function parseRole(raw: unknown): DealershipCollaboratorRow["role"] | null {
  if (raw === "owner" || raw === "manager" || raw === "seller") {
    return raw;
  }
  return null;
}

export async function fetchDealershipCollaborators(
  dealershipId: string,
): Promise<DealershipCollaboratorRow[]> {
  let service;
  try {
    service = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }

  const { data: profiles, error } = await service
    .from("profiles")
    .select("id, role")
    .eq("dealership_id", dealershipId);

  if (error || !Array.isArray(profiles)) {
    return [];
  }

  const rows: DealershipCollaboratorRow[] = [];

  for (const row of profiles) {
    const id = typeof row.id === "string" ? row.id : null;
    const role = parseRole(row.role);
    if (!id || !role) {
      continue;
    }

    const { data: userData, error: userError } =
      await service.auth.admin.getUserById(id);
    const email =
      !userError && userData?.user?.email
        ? String(userData.user.email)
        : null;
    const meta = userData?.user?.user_metadata;
    const fullNameRaw =
      meta && typeof meta === "object" && meta !== null && "full_name" in meta
        ? (meta as { full_name?: unknown }).full_name
        : null;
    const full_name =
      typeof fullNameRaw === "string" && fullNameRaw.trim().length > 0
        ? fullNameRaw.trim()
        : null;

    rows.push({
      id,
      role,
      email,
      full_name,
    });
  }

  rows.sort((a, b) => {
    const order = ["owner", "manager", "seller"] as const;
    const ai = order.indexOf(a.role);
    const bi = order.indexOf(b.role);
    if (ai !== bi) {
      return ai - bi;
    }
    return (a.email ?? "").localeCompare(b.email ?? "");
  });

  return rows;
}
