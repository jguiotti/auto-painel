import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

import type { PlatformProfileRole, PlatformUserRow } from "@/types/platform-user";

function parseRole(raw: unknown): PlatformProfileRole | null {
  if (
    raw === "super_admin" ||
    raw === "owner" ||
    raw === "manager" ||
    raw === "seller" ||
    raw === "admin"
  ) {
    return raw;
  }
  return null;
}

function readFullName(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }
  const fullNameRaw = (metadata as { full_name?: unknown }).full_name;
  if (typeof fullNameRaw !== "string") {
    return null;
  }
  const trimmed = fullNameRaw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function fetchPlatformUsers(): Promise<PlatformUserRow[]> {
  let service;
  try {
    service = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }

  const { data: profileRows, error: profilesError } = await service
    .from("profiles")
    .select(
      `
      id,
      role,
      dealership_id,
      dealerships (
        name,
        slug
      )
    `,
    )
    .order("role", { ascending: true });

  if (profilesError || !Array.isArray(profileRows)) {
    return [];
  }

  const rows: PlatformUserRow[] = [];

  for (const row of profileRows) {
    const id = typeof row.id === "string" ? row.id : null;
    const role = parseRole(row.role);
    if (!id || !role) {
      continue;
    }

    const dealershipRaw = row.dealerships as
      | { name?: unknown; slug?: unknown }
      | { name?: unknown; slug?: unknown }[]
      | null;

    const dealership =
      Array.isArray(dealershipRaw) ? dealershipRaw[0] : dealershipRaw;

    const dealership_name =
      typeof dealership?.name === "string" ? dealership.name : null;
    const dealership_slug =
      typeof dealership?.slug === "string" ? dealership.slug : null;

    const { data: userData, error: userError } =
      await service.auth.admin.getUserById(id);

    const auth_exists = !userError && Boolean(userData?.user);
    const email =
      auth_exists && userData?.user?.email ? String(userData.user.email) : null;
    const full_name = auth_exists
      ? readFullName(userData?.user?.user_metadata)
      : null;
    const created_at =
      auth_exists && userData?.user?.created_at
        ? String(userData.user.created_at)
        : null;

    rows.push({
      id,
      role,
      email,
      full_name,
      dealership_id:
        typeof row.dealership_id === "string" ? row.dealership_id : null,
      dealership_name,
      dealership_slug,
      auth_exists,
      created_at,
    });
  }

  rows.sort((a, b) => {
    const storeA = a.dealership_name ?? "";
    const storeB = b.dealership_name ?? "";
    if (storeA !== storeB) {
      return storeA.localeCompare(storeB, "pt-BR");
    }
    return (a.email ?? a.id).localeCompare(b.email ?? b.id, "pt-BR");
  });

  return rows;
}

export function splitPlatformUsersByAudience(users: PlatformUserRow[]): {
  platformOperators: PlatformUserRow[];
  storeUsers: PlatformUserRow[];
} {
  const platformOperators = users.filter(
    (user) => user.role === "super_admin" && user.dealership_id === null,
  );
  const storeUsers = users.filter(
    (user) =>
      user.dealership_id !== null &&
      (user.role === "owner" ||
        user.role === "manager" ||
        user.role === "seller" ||
        user.role === "admin"),
  );

  return { platformOperators, storeUsers };
}
