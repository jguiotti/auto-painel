/**
 * AutoPainel — provisions an auth user + profile (owner) for a dealership.
 * Invoke with header: x-provision-key: <PROVISION_FUNCTION_SECRET> (set in Supabase secrets).
 */
import { createClient } from "npm:@supabase/supabase-js@2.104.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-provision-key",
};

interface ProvisionBody {
  email?: string;
  full_name?: string;
  dealership_id?: string;
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

  const expected = Deno.env.get("PROVISION_FUNCTION_SECRET") ?? "";
  if (!expected || req.headers.get("x-provision-key") !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ error: "Server misconfigured (missing Supabase env)" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  let body: ProvisionBody;
  try {
    body = (await req.json()) as ProvisionBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email = String(body.email ?? "")
    .trim()
    .toLowerCase();
  const fullName = String(body.full_name ?? "").trim();
  const dealershipId = String(body.dealership_id ?? "").trim();

  if (!email || !fullName || !dealershipId) {
    return new Response(
      JSON.stringify({ error: "email, full_name, and dealership_id are required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const tempPassword =
    crypto.randomUUID().replaceAll("-", "").slice(0, 20) + "Aa1!";

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createErr || !created?.user?.id) {
    return new Response(
      JSON.stringify({
        error: createErr?.message ?? "Failed to create auth user",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const userId = created.user.id;

  const { error: profileErr } = await admin.from("profiles").insert({
    id: userId,
    dealership_id: dealershipId,
    role: "owner",
  });

  if (profileErr) {
    await admin.auth.admin.deleteUser(userId);
    return new Response(
      JSON.stringify({
        error: profileErr.message,
        detail: "Profile insert failed; auth user was rolled back.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      user_id: userId,
      email,
      temporary_password: tempPassword,
      message:
        "User created. Share the temporary password securely; ask them to change it after first login.",
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
