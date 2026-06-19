export const PANEL_INVENTORY_PAGE_SIZE = 20;

export type PanelInventoryStatusFilter = "all" | "available" | "sold" | "inactive";
export type PanelInventoryFeaturedFilter = "all" | "yes" | "no";

export interface PanelInventorySearchParams {
  q: string;
  status: PanelInventoryStatusFilter;
  featured: PanelInventoryFeaturedFilter;
  page: number;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
}

export function parsePanelInventorySearchParams(
  input: Record<string, string | string[] | undefined>,
): PanelInventorySearchParams {
  const rawQ = input.q;
  const q = typeof rawQ === "string" ? rawQ.trim() : "";

  const rawStatus = input.status;
  const statusValue = typeof rawStatus === "string" ? rawStatus : "all";
  const status: PanelInventoryStatusFilter =
    statusValue === "available" ||
    statusValue === "sold" ||
    statusValue === "inactive"
      ? statusValue
      : "all";

  const rawFeatured = input.featured;
  const featuredValue = typeof rawFeatured === "string" ? rawFeatured : "all";
  const featured: PanelInventoryFeaturedFilter =
    featuredValue === "yes" || featuredValue === "no" ? featuredValue : "all";

  const rawPage = typeof input.page === "string" ? input.page : undefined;
  const page = parsePositiveInt(rawPage, 1);

  return { q, status, featured, page };
}

export function buildPanelInventoryQueryString(
  params: PanelInventorySearchParams,
): string {
  const search = new URLSearchParams();
  if (params.q) {
    search.set("q", params.q);
  }
  if (params.status !== "all") {
    search.set("status", params.status);
  }
  if (params.featured !== "all") {
    search.set("featured", params.featured);
  }
  if (params.page > 1) {
    search.set("page", String(params.page));
  }
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}
