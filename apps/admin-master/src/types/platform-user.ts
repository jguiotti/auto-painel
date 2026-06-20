export type PlatformProfileRole =
  | "super_admin"
  | "owner"
  | "manager"
  | "seller"
  | "admin";

export interface PlatformUserRow {
  id: string;
  role: PlatformProfileRole;
  email: string | null;
  full_name: string | null;
  dealership_id: string | null;
  dealership_name: string | null;
  dealership_slug: string | null;
  auth_exists: boolean;
  created_at: string | null;
}

export type PlatformUserAudience = "storefront" | "platform";
