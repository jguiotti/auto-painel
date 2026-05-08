import "server-only";

import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";

export type BillingSupportingDocKind =
  | "contract"
  | "receipt"
  | "invoice"
  | "other";

export interface BillingSupportingDocument {
  id: string;
  stored_path: string;
  original_name: string;
  doc_kind: BillingSupportingDocKind;
  uploaded_at: string;
}

export interface DealershipBillingRow {
  id: string;
  dealership_id: string;
  monthly_amount: number;
  due_day: number;
  payment_method: string | null;
  last_payment_date: string | null;
  agreement_status: string;
  internal_notes: string | null;
  contract_started_on: string | null;
  contract_ends_on: string | null;
}

export interface DealershipBillingHistoryRow {
  id: string;
  dealership_id: string;
  billing_period_start: string;
  expected_amount: number;
  settlement_status: "paid" | "pending" | "overdue";
  due_date: string;
  paid_at: string | null;
  reference: string | null;
  supporting_documents: BillingSupportingDocument[];
}

function parseIsoDateOnly(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 8) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.toISOString().slice(0, 10);
}

function parseDocKind(raw: unknown): BillingSupportingDocKind {
  if (
    raw === "contract" ||
    raw === "receipt" ||
    raw === "invoice" ||
    raw === "other"
  ) {
    return raw;
  }
  return "other";
}

export function parseBillingSupportingDocuments(
  raw: unknown,
): BillingSupportingDocument[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: BillingSupportingDocument[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id : null;
    const stored_path = typeof o.stored_path === "string" ? o.stored_path : null;
    const original_name =
      typeof o.original_name === "string" ? o.original_name : null;
    const uploaded_at =
      typeof o.uploaded_at === "string" ? o.uploaded_at : null;
    if (!id || !stored_path || !original_name || !uploaded_at) {
      continue;
    }
    out.push({
      id,
      stored_path,
      original_name,
      doc_kind: parseDocKind(o.doc_kind),
      uploaded_at,
    });
  }
  return out;
}

export async function fetchDealershipBilling(
  dealershipId: string,
): Promise<DealershipBillingRow | null> {
  let service;
  try {
    service = createSupabaseServiceRoleClient();
  } catch {
    return null;
  }

  const { data, error } = await service
    .from("dealership_billing")
    .select("*")
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (error || !data || typeof data !== "object") {
    return null;
  }

  const r = data as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : null;
  const dealership_id = typeof r.dealership_id === "string" ? r.dealership_id : null;
  const monthly_amount = Number(r.monthly_amount ?? 0);
  const due_day = Number(r.due_day ?? 10);
  if (!id || !dealership_id || Number.isNaN(monthly_amount) || Number.isNaN(due_day)) {
    return null;
  }

  return {
    id,
    dealership_id,
    monthly_amount,
    due_day,
    payment_method:
      typeof r.payment_method === "string" ? r.payment_method : null,
    last_payment_date:
      typeof r.last_payment_date === "string" ? r.last_payment_date : null,
    agreement_status:
      typeof r.agreement_status === "string" ? r.agreement_status : "active",
    internal_notes:
      typeof r.internal_notes === "string" ? r.internal_notes : null,
    contract_started_on: parseIsoDateOnly(r.contract_started_on),
    contract_ends_on: parseIsoDateOnly(r.contract_ends_on),
  };
}

export async function fetchDealershipBillingHistory(
  dealershipId: string,
): Promise<DealershipBillingHistoryRow[]> {
  let service;
  try {
    service = createSupabaseServiceRoleClient();
  } catch {
    return [];
  }

  const { data, error } = await service
    .from("dealership_billing_history")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("billing_period_start", { ascending: false })
    .limit(36);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((row) => {
    const r = row as Record<string, unknown>;
    const settlement = r.settlement_status;
    const status: DealershipBillingHistoryRow["settlement_status"] =
      settlement === "paid" || settlement === "pending" || settlement === "overdue"
        ? settlement
        : "pending";
    return {
      id: String(r.id ?? ""),
      dealership_id: String(r.dealership_id ?? ""),
      billing_period_start: String(r.billing_period_start ?? ""),
      expected_amount: Number(r.expected_amount ?? 0),
      settlement_status: status,
      due_date: String(r.due_date ?? ""),
      paid_at:
        typeof r.paid_at === "string" ? r.paid_at : null,
      reference: typeof r.reference === "string" ? r.reference : null,
      supporting_documents: parseBillingSupportingDocuments(
        r.supporting_documents,
      ),
    };
  });
}

export interface OperatorBillingSuite {
  billing: DealershipBillingRow | null;
  history: DealershipBillingHistoryRow[];
  tablesMissing: boolean;
}

export async function fetchDealershipOperatorBillingSuite(
  dealershipId: string,
): Promise<OperatorBillingSuite> {
  let service;
  try {
    service = createSupabaseServiceRoleClient();
  } catch {
    return { billing: null, history: [], tablesMissing: true };
  }

  const probe = await service.from("dealership_billing").select("id").limit(1);

  const msg = probe.error?.message.toLowerCase() ?? "";
  const tablesMissing =
    !!probe.error &&
    (probe.error.code === "42P01" ||
      msg.includes("does not exist") ||
      (msg.includes("relation") && msg.includes("not found")));

  if (tablesMissing) {
    return { billing: null, history: [], tablesMissing: true };
  }

  const [billing, history] = await Promise.all([
    fetchDealershipBilling(dealershipId),
    fetchDealershipBillingHistory(dealershipId),
  ]);

  return { billing, history, tablesMissing: false };
}
