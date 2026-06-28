import type { PublicContractAcceptancePreview } from "../../types/growth-operations";

export function mapPublicContractAcceptancePreview(
  raw: unknown,
): PublicContractAcceptancePreview | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const row = raw as Record<string, unknown>;

  return {
    contractId: String(row.contract_id ?? ""),
    counterpartyName: String(row.counterparty_name ?? ""),
    counterpartyEmail: String(row.counterparty_email ?? ""),
    planName: typeof row.plan_name === "string" ? row.plan_name : null,
    bodyMarkdown: String(row.body_markdown ?? ""),
    expiresAt: String(row.expires_at ?? ""),
    isExpired: row.is_expired === true,
    alreadyAccepted: row.already_accepted === true,
  };
}
