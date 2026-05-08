export interface ProfileRoleRow {
  role: string;
  dealership_id: string | null;
}

export function isPlatformOperatorProfile(
  profile: ProfileRoleRow | null,
): boolean {
  if (!profile) {
    return false;
  }
  const role = String(profile.role ?? "").trim();
  const dealershipId = profile.dealership_id;
  const hasNoDealership =
    dealershipId === null ||
    dealershipId === undefined ||
    String(dealershipId).trim() === "";
  return role === "super_admin" && hasNoDealership;
}
