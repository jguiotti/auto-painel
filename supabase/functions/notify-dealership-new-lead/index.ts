/**
 * AutoPainel — processes lead_notification_outbox and e-mails the commercial team.
 * Invoke: POST {SUPABASE_URL}/functions/v1/notify-dealership-new-lead
 * Body: { "limit": 10 }
 */
import { createClient } from "npm:@supabase/supabase-js@2.104.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OutboxRow {
  id: string;
  dealership_id: string;
  lead_id: string;
}

interface LeadRow {
  id: string;
  client_name: string;
  phone: string;
  type: string;
  source: string | null;
  message: string | null;
}

interface DealershipRow {
  id: string;
  name: string;
}

interface ProfileRow {
  id: string;
  role: string;
}

const COMMERCIAL_ROLES = new Set(["owner", "manager", "seller"]);

const SOURCE_LABELS: Record<string, string> = {
  vehicle_page: "Veículo",
  finance_simulator: "Financiamento",
  contact_page: "Página de contato",
  whatsapp_float: "WhatsApp",
  manual: "Cadastro manual",
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function resolveCommercialEmails(
  admin: ReturnType<typeof createClient>,
  dealershipId: string,
): Promise<string[]> {
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("id, role")
    .eq("dealership_id", dealershipId)
    .in("role", ["owner", "manager", "seller"]);

  if (error || !profiles?.length) {
    return [];
  }

  const emails = new Set<string>();
  for (const profile of profiles as ProfileRow[]) {
    if (!COMMERCIAL_ROLES.has(profile.role)) {
      continue;
    }
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id);
    if (userError || !userData.user?.email) {
      continue;
    }
    emails.add(userData.user.email.trim().toLowerCase());
  }
  return Array.from(emails);
}

async function sendLeadNotificationEmail(input: {
  resendApiKey: string;
  fromEmail: string;
  to: string[];
  dealershipName: string;
  lead: LeadRow;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (input.to.length === 0) {
    return { ok: false, message: "no_recipients" };
  }

  const sourceLabel = input.lead.source
    ? SOURCE_LABELS[input.lead.source] ?? input.lead.source
    : "Vitrine";
  const typeLabel = input.lead.type === "simulation" ? "Simulação" : "Contato";
  const messageBlock = input.lead.message?.trim()
    ? `<p style="margin:12px 0;padding:12px;background:#f4f4f5;border-radius:8px;">${escapeHtml(input.lead.message.trim())}</p>`
    : "";

  const html = `
    <div style="font-family:Arial,sans-serif;color:#18181b;max-width:560px;">
      <p style="font-size:14px;color:#71717a;">Novo lead na vitrine</p>
      <h1 style="font-size:20px;margin:0 0 8px;">${escapeHtml(input.dealershipName)}</h1>
      <p style="margin:0 0 16px;"><strong>${escapeHtml(input.lead.client_name)}</strong> · ${escapeHtml(input.lead.phone)}</p>
      <p style="margin:0 0 8px;">${typeLabel} · ${sourceLabel}</p>
      ${messageBlock}
      <p style="margin-top:20px;font-size:13px;color:#71717a;">Abra o painel da loja em Contatos para assumir ou acompanhar este lead.</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.fromEmail,
      to: input.to,
      subject: `Novo contato na vitrine — ${input.dealershipName}`,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return { ok: false, message: `resend_${response.status}:${text.slice(0, 300)}` };
  }

  return { ok: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const fromEmail =
    Deno.env.get("LEAD_NOTIFICATION_FROM_EMAIL") ?? "AutoPainel <notificacoes@autopainel.com.br>";

  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let limit = 10;
  try {
    const body = (await req.json()) as { limit?: number };
    if (typeof body.limit === "number" && body.limit > 0 && body.limit <= 50) {
      limit = body.limit;
    }
  } catch {
    // default limit
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: pendingRows, error: pendingError } = await admin
    .from("lead_notification_outbox")
    .select("id, dealership_id, lead_id")
    .is("processed_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (pendingError) {
    return new Response(JSON.stringify({ error: pendingError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rows = (pendingRows ?? []) as OutboxRow[];
  let processed = 0;
  let failed = 0;

  for (const row of rows) {
    const [{ data: lead }, { data: dealership }] = await Promise.all([
      admin
        .from("leads")
        .select("id, client_name, phone, type, source, message")
        .eq("id", row.lead_id)
        .maybeSingle(),
      admin.from("dealerships").select("id, name").eq("id", row.dealership_id).maybeSingle(),
    ]);

    if (!lead || !dealership) {
      await admin
        .from("lead_notification_outbox")
        .update({
          processed_at: new Date().toISOString(),
          error_message: "lead_or_dealership_missing",
        })
        .eq("id", row.id);
      failed += 1;
      continue;
    }

    const recipients = await resolveCommercialEmails(admin, row.dealership_id);
    const sendResult = await sendLeadNotificationEmail({
      resendApiKey,
      fromEmail,
      to: recipients,
      dealershipName: (dealership as DealershipRow).name,
      lead: lead as LeadRow,
    });

    if (sendResult.ok) {
      await admin
        .from("lead_notification_outbox")
        .update({ processed_at: new Date().toISOString(), error_message: null })
        .eq("id", row.id);
      processed += 1;
    } else {
      await admin
        .from("lead_notification_outbox")
        .update({ error_message: sendResult.message })
        .eq("id", row.id);
      failed += 1;
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      queued: rows.length,
      processed,
      failed,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
