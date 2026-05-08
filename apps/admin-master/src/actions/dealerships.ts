"use server";

import { revalidatePath } from "next/cache";

import { DEALERSHIP_OPTIONAL_FEATURES } from "@autopainel/shared/lib/dealership-features";
import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";
import type { StorefrontLayoutTemplateId } from "@autopainel/shared/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import googleFontFamilies from "@autopainel/shared/data/google-fonts-families.json";

import { requireAdminSession } from "@/lib/auth/require-admin";
import { digitsOnly, normalizeDomainHostname } from "@/lib/br-format";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const PRICING_PLAN_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BRANDING_BUCKET = "dealership-branding";
const MAX_BRAND_BYTES = 2 * 1024 * 1024;
const ALLOWED_BRAND_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const KNOWN_GOOGLE_FONT_NAMES = new Set(googleFontFamilies as string[]);

function parseGoogleFontField(
  formData: FormData,
  fieldName: string,
):
  | { ok: true; family: string | null }
  | { ok: false; error: string } {
  const raw = String(formData.get(fieldName) ?? "").trim();
  if (raw.length === 0) {
    return { ok: true, family: null };
  }
  if (!KNOWN_GOOGLE_FONT_NAMES.has(raw)) {
    return {
      ok: false,
      error:
        "Família tipográfica inválida ou fora da lista gratuita das Google Fonts. Escolha na pesquisa do formulário.",
    };
  }
  return { ok: true, family: raw };
}

const REVALIDATE_PATHS = [
  "/painel/concessionarias",
  "/painel/dashboard",
  "/painel/financeiro",
  "/painel/planos",
  "/painel/usuarios",
];

const CNPJ_LENGTH_HINT =
  "O CNPJ deve ter 14 números (ex.: 12.345.678/0001-90). Complete os dois dígitos após o hífen.";

function explainDealershipUniqueViolation(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("slug")) {
    return "Este subdomínio já está em uso. Escolha outro slug.";
  }
  if (m.includes("cnpj")) {
    return "Este CNPJ já está cadastrado em outra concessionária.";
  }
  if (m.includes("domain") || m.includes("custom")) {
    return "Este domínio personalizado já está associado a outra concessionária.";
  }
  return "Algum dado único já existe na base (subdomínio, CNPJ ou domínio). Confira slug, CNPJ e domínio.";
}

function friendlyDealershipDbError(rawMessage: string): string {
  const trimmed = rawMessage.trim();
  if (!trimmed) {
    return "Não foi possível concluir a operação. Tente novamente em instantes.";
  }
  if (
    trimmed.toLowerCase().includes("unique") ||
    trimmed.includes("23505")
  ) {
    return explainDealershipUniqueViolation(trimmed);
  }
  return `Erro ao salvar: ${trimmed}`;
}

function parsePricingPlanIdFromForm(formData: FormData): string | null {
  const raw = String(formData.get("pricing_plan_id") ?? "").trim();
  if (!PRICING_PLAN_UUID_RE.test(raw)) {
    return null;
  }
  return raw;
}

async function subscriptionPlanSlugForPricingPlan(
  supabase: SupabaseClient,
  pricing_plan_id: string | null,
): Promise<string | null> {
  if (!pricing_plan_id) {
    return null;
  }
  const { data } = await supabase
    .from("pricing_plans")
    .select("slug")
    .eq("id", pricing_plan_id)
    .maybeSingle();
  const slug = data?.slug;
  return typeof slug === "string" && slug.length > 0 ? slug : null;
}

function parseLayoutIdFromForm(formData: FormData): StorefrontLayoutTemplateId {
  const raw = String(formData.get("layout_id") ?? "1").trim();
  if (raw === "2") {
    return 2;
  }
  if (raw === "3") {
    return 3;
  }
  return 1;
}

function parseThemeSettings(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
}

function parseRecord(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
}

function mergeBrandColors(
  base: Record<string, unknown>,
  primary: string,
  primaryForeground: string,
): Record<string, unknown> {
  return {
    ...base,
    primary,
    primaryForeground,
  };
}

function parseEnabledFeaturesFromForm(formData: FormData): string[] {
  const keys: string[] = [];
  for (const { key } of DEALERSHIP_OPTIONAL_FEATURES) {
    const v = formData.get(`feature_${key}`);
    if (v === "on" || v === "true" || v === "1") {
      keys.push(key);
    }
  }
  return keys;
}

function hqAddressFromForm(formData: FormData): Record<string, string> {
  const postal = digitsOnly(String(formData.get("hq_postal_code") ?? "")).slice(
    0,
    8,
  );
  const state = String(formData.get("hq_state") ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 2);
  const city = String(formData.get("hq_city") ?? "").trim();
  const district = String(formData.get("hq_district") ?? "").trim();
  const street = String(formData.get("hq_street") ?? "").trim();
  const number = String(formData.get("hq_number") ?? "").trim();
  const complement = String(formData.get("hq_complement") ?? "").trim();

  const out: Record<string, string> = {};
  if (postal.length === 8) {
    out.postal_code = postal;
  }
  if (state.length === 2) {
    out.state = state;
  }
  if (city) {
    out.city = city;
  }
  if (district) {
    out.district = district;
  }
  if (street) {
    out.street = street;
  }
  if (number) {
    out.number = number;
  }
  if (complement) {
    out.complement = complement;
  }
  return out;
}

function normalizeSocialUrl(raw: string): string {
  const s = raw.trim();
  if (!s) {
    return "";
  }
  if (!/^https?:\/\//i.test(s)) {
    return `https://${s}`;
  }
  return s;
}

function buildContentConfig(
  formData: FormData,
  existingContent: Record<string, unknown>,
): Record<string, unknown> {
  const base = { ...parseRecord(existingContent) };
  delete base.address;

  const about = String(formData.get("about_text") ?? "").trim();
  const ig = normalizeSocialUrl(String(formData.get("social_instagram") ?? ""));
  const fb = normalizeSocialUrl(String(formData.get("social_facebook") ?? ""));
  const site = normalizeSocialUrl(String(formData.get("social_website") ?? ""));

  const social: Record<string, string> = {};
  if (ig) {
    social.instagram = ig;
  }
  if (fb) {
    social.facebook = fb;
  }
  if (site) {
    social.website = site;
  }

  const hq_address = hqAddressFromForm(formData);

  const out: Record<string, unknown> = { ...base };
  if (about.length > 0) {
    out.about_text = about;
  } else {
    delete out.about_text;
  }

  if (Object.keys(hq_address).length > 0) {
    out.hq_address = hq_address;
  } else {
    delete out.hq_address;
  }

  if (Object.keys(social).length > 0) {
    out.social_links = social;
  } else {
    delete out.social_links;
  }

  return out;
}

interface ParsedDealershipUnitRow {
  id?: string;
  name: string;
  address: Record<string, string>;
}

function parseUnitsPayload(
  raw: FormDataEntryValue | null,
):
  | { ok: true; units: ParsedDealershipUnitRow[] }
  | { ok: false; error: string } {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) {
    return { ok: false, error: "Informe pelo menos uma unidade da concessionária." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: "Lista de unidades inválida." };
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { ok: false, error: "Cadastre pelo menos uma unidade." };
  }

  if (parsed.length > 40) {
    return { ok: false, error: "Limite de 40 unidades por concessionária." };
  }

  const units: ParsedDealershipUnitRow[] = [];

  const addrKeys = [
    "postal_code",
    "state",
    "city",
    "district",
    "street",
    "number",
    "complement",
  ] as const;

  for (const row of parsed) {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      return { ok: false, error: "Formato de unidade inválido." };
    }
    const r = row as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (name.length < 2) {
      return {
        ok: false,
        error: "Cada unidade precisa de um nome com pelo menos 2 caracteres.",
      };
    }

    const addr: Record<string, string> = {};
    const addrRaw = r.address;
    if (addrRaw && typeof addrRaw === "object" && !Array.isArray(addrRaw)) {
      const ao = addrRaw as Record<string, unknown>;
      for (const key of addrKeys) {
        const v = ao[key];
        if (typeof v !== "string") {
          continue;
        }
        const trimmed = v.trim();
        if (!trimmed) {
          continue;
        }
        if (key === "state") {
          addr[key] = trimmed.toUpperCase().slice(0, 2);
        } else if (key === "postal_code") {
          addr[key] = digitsOnly(trimmed).slice(0, 8);
        } else {
          addr[key] = trimmed;
        }
      }
    }

    const idRaw = r.id;
    const id =
      typeof idRaw === "string" && /^[0-9a-f-]{36}$/i.test(idRaw)
        ? idRaw
        : undefined;

    units.push({ id, name, address: addr });
  }

  return { ok: true, units };
}

async function syncDealershipUnits(
  supabase: SupabaseClient,
  dealershipId: string,
  units: ParsedDealershipUnitRow[],
): Promise<{ error?: string }> {
  const { data: existingRows, error: loadErr } = await supabase
    .from("dealership_units")
    .select("id")
    .eq("dealership_id", dealershipId);

  if (loadErr) {
    return {
      error:
        loadErr.message?.trim().length > 0
          ? `Não foi possível carregar as unidades: ${loadErr.message}`
          : "Não foi possível carregar as unidades. Tente novamente.",
    };
  }

  const incomingIds = new Set(
    units.filter((u) => u.id).map((u) => u.id as string),
  );

  for (const row of existingRows ?? []) {
    const rid = row.id as string;
    if (!incomingIds.has(rid)) {
      const { count } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("dealership_unit_id", rid);

      if ((count ?? 0) > 0) {
        return {
          error:
            "Não é possível remover uma unidade que ainda possui veículos no estoque. Reassocie ou remova os veículos primeiro.",
        };
      }

      const { error: delErr } = await supabase
        .from("dealership_units")
        .delete()
        .eq("id", rid);

      if (delErr) {
        return { error: delErr.message };
      }
    }
  }

  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const payload = {
      dealership_id: dealershipId,
      name: u.name,
      address: u.address,
      sort_order: i,
    };

    if (u.id) {
      const { error: upErr } = await supabase
        .from("dealership_units")
        .update({
          name: payload.name,
          address: payload.address,
          sort_order: payload.sort_order,
        })
        .eq("id", u.id)
        .eq("dealership_id", dealershipId);

      if (upErr) {
        return { error: upErr.message };
      }
    } else {
      const { error: insErr } = await supabase
        .from("dealership_units")
        .insert(payload);

      if (insErr) {
        return { error: insErr.message };
      }
    }
  }

  return {};
}

function themeColorsOnly(primaryHex: string, secondaryHex: string): Record<string, unknown> {
  return {
    primary_color: primaryHex,
    secondary_color: secondaryHex,
  };
}

function extensionFromMime(type: string): string {
  if (type === "image/jpeg") {
    return "jpg";
  }
  if (type === "image/png") {
    return "png";
  }
  if (type === "image/webp") {
    return "webp";
  }
  if (type === "image/gif") {
    return "gif";
  }
  return "jpg";
}

function validateBrandFile(file: File): string | null {
  if (file.size > MAX_BRAND_BYTES) {
    return "Cada imagem deve ter no máximo 2 MB.";
  }
  if (!ALLOWED_BRAND_MIME.has(file.type)) {
    return "Formato não suportado. Use JPEG, PNG, WebP ou GIF.";
  }
  return null;
}

async function uploadDealershipBrandAsset(
  supabase: SupabaseClient,
  dealershipId: string,
  kind: "header_logo" | "footer_logo" | "logo" | "favicon",
  file: File,
): Promise<{ url?: string; error?: string }> {
  const validationError = validateBrandFile(file);
  if (validationError) {
    return { error: validationError };
  }
  const ext = extensionFromMime(file.type || "image/jpeg");
  const slug =
    kind === "header_logo"
      ? "header-logo"
      : kind === "footer_logo"
        ? "footer-logo"
        : kind === "logo"
          ? "logo"
          : "favicon";
  const path = `${dealershipId}/${slug}-${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(BRANDING_BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });
  if (upErr) {
    const pt =
      kind === "favicon"
        ? "o favicon"
        : kind === "footer_logo"
          ? "o logo do rodapé"
          : "o logo do cabeçalho";
    return { error: `Falha ao enviar ${pt}: ${upErr.message}` };
  }
  const { data: pub } = supabase.storage.from(BRANDING_BUCKET).getPublicUrl(path);
  return { url: pub.publicUrl };
}

export async function createDealershipAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const cnpj = String(formData.get("cnpj") ?? "").trim();
  const customDomain = String(formData.get("custom_domain") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp_number") ?? "").trim();
  const primary = String(formData.get("primary_color") ?? "").trim();
  const secondary = String(formData.get("secondary_color") ?? "").trim();
  const primaryFg = String(formData.get("primary_foreground") ?? "").trim();
  const status = String(formData.get("status") ?? "pending_setup").trim();

  if (name.length < 2) {
    return {
      error: "Nome da concessionária é obrigatório (mínimo 2 caracteres).",
    };
  }
  if (!SLUG_RE.test(slug)) {
    return {
      error:
        "Subdomínio inválido. Use apenas letras minúsculas, números e hífens (ex.: minha-loja).",
    };
  }
  if (!HEX_RE.test(primary) || !HEX_RE.test(primaryFg) || !HEX_RE.test(secondary)) {
    return {
      error:
        "Escolha cores válidas em formato hexadecimal (#RRGGBB), usando o seletor ao lado.",
    };
  }

  const allowedStatus = new Set([
    "active",
    "suspended",
    "pending_setup",
    "churned",
  ]);
  if (!allowedStatus.has(status)) {
    return { error: "Status inválido." };
  }

  const unitsParsed = parseUnitsPayload(formData.get("units_payload"));
  if (!unitsParsed.ok) {
    return { error: unitsParsed.error };
  }

  const cnpjDigits = digitsOnly(cnpj);
  if (cnpjDigits.length > 0 && cnpjDigits.length !== 14) {
    return {
      error:
        cnpjDigits.length < 14
          ? `${CNPJ_LENGTH_HINT} Faltam ${14 - cnpjDigits.length} número(s).`
          : `${CNPJ_LENGTH_HINT} Remova números a mais.`,
    };
  }

  const whatsappDigits = digitsOnly(whatsapp);
  if (
    whatsappDigits.length > 0 &&
    (whatsappDigits.length < 10 || whatsappDigits.length > 11)
  ) {
    return {
      error:
        "Telefone/WhatsApp inválido: informe DDD + número (10 ou 11 dígitos).",
    };
  }

  const emailNorm = contactEmail.trim().toLowerCase();
  const domainNorm = normalizeDomainHostname(customDomain);

  const theme_settings = mergeBrandColors({}, primary, primaryFg);
  theme_settings.accent = secondary;

  const headingFont = parseGoogleFontField(formData, "google_font_heading");
  if (!headingFont.ok) {
    return { error: headingFont.error };
  }
  const bodyFont = parseGoogleFontField(formData, "google_font_body");
  if (!bodyFont.ok) {
    return { error: bodyFont.error };
  }

  const theme_config: Record<string, unknown> = {
    ...themeColorsOnly(primary, secondary),
  };
  if (headingFont.family) {
    theme_config.google_font_heading = headingFont.family;
  }
  if (bodyFont.family) {
    theme_config.google_font_body = bodyFont.family;
  }

  const content_config = buildContentConfig(formData, {});
  const enabled_features = parseEnabledFeaturesFromForm(formData);
  const layout_id = parseLayoutIdFromForm(formData);
  const pricing_plan_id = parsePricingPlanIdFromForm(formData);

  const headerLogoFileRaw = formData.get("header_logo_file");
  const footerLogoFileRaw = formData.get("footer_logo_file");
  const faviconFileRaw = formData.get("favicon_file");

  if (headerLogoFileRaw instanceof File && headerLogoFileRaw.size > 0) {
    const ve = validateBrandFile(headerLogoFileRaw);
    if (ve) {
      return { error: ve };
    }
  }
  if (footerLogoFileRaw instanceof File && footerLogoFileRaw.size > 0) {
    const ve = validateBrandFile(footerLogoFileRaw);
    if (ve) {
      return { error: ve };
    }
  }
  if (faviconFileRaw instanceof File && faviconFileRaw.size > 0) {
    const ve = validateBrandFile(faviconFileRaw);
    if (ve) {
      return { error: ve };
    }
  }

  const supabase = createSupabaseServiceRoleClient();

  const subscription_plan_insert =
    (await subscriptionPlanSlugForPricingPlan(supabase, pricing_plan_id)) ??
    "trial";

  const { data: inserted, error } = await supabase
    .from("dealerships")
    .insert({
      name,
      slug,
      cnpj: cnpjDigits.length === 14 ? cnpjDigits : null,
      custom_domain: domainNorm.length > 0 ? domainNorm : null,
      contact_email: emailNorm.length > 0 ? emailNorm : null,
      whatsapp_number: whatsappDigits.length > 0 ? whatsappDigits : null,
      logo_url: null,
      theme_settings,
      theme_config,
      content_config,
      enabled_features,
      status,
      layout_id,
      pricing_plan_id,
      subscription_plan: subscription_plan_insert,
      subscription_status: "trialing",
      subscription_current_period_end: null,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    if (
      error?.message?.includes("unique") ||
      error?.code === "23505"
    ) {
      return {
        error: explainDealershipUniqueViolation(error?.message ?? ""),
      };
    }
    return {
      error:
        error?.message != null && error.message.length > 0
          ? friendlyDealershipDbError(error.message)
          : "Não foi possível criar a concessionária. Verifique os dados e tente novamente.",
    };
  }

  const dealershipId = inserted.id as string;

  let finalHeaderUrl = String(formData.get("header_logo_url") ?? "").trim() || null;
  let finalFooterUrl = String(formData.get("footer_logo_url") ?? "").trim() || null;
  let finalFaviconUrl = String(formData.get("favicon_url") ?? "").trim() || null;

  if (headerLogoFileRaw instanceof File && headerLogoFileRaw.size > 0) {
    const up = await uploadDealershipBrandAsset(supabase, dealershipId, "header_logo", headerLogoFileRaw);
    if (up.error) {
      await supabase.from("dealerships").delete().eq("id", dealershipId);
      return { error: up.error };
    }
    finalHeaderUrl = up.url ?? null;
  }

  if (footerLogoFileRaw instanceof File && footerLogoFileRaw.size > 0) {
    const up = await uploadDealershipBrandAsset(supabase, dealershipId, "footer_logo", footerLogoFileRaw);
    if (up.error) {
      await supabase.from("dealerships").delete().eq("id", dealershipId);
      return { error: up.error };
    }
    finalFooterUrl = up.url ?? null;
  }

  if (faviconFileRaw instanceof File && faviconFileRaw.size > 0) {
    const up = await uploadDealershipBrandAsset(supabase, dealershipId, "favicon", faviconFileRaw);
    if (up.error) {
      await supabase.from("dealerships").delete().eq("id", dealershipId);
      return { error: up.error };
    }
    finalFaviconUrl = up.url ?? null;
  }

  const mergedTheme = {
    ...theme_config,
    ...(finalHeaderUrl
      ? {
          header_logo_url: finalHeaderUrl,
          logo_url: finalHeaderUrl,
        }
      : {}),
    ...(finalFooterUrl ? { footer_logo_url: finalFooterUrl } : {}),
    ...(finalFaviconUrl ? { favicon_url: finalFaviconUrl } : {}),
  };

  const needsBrandPersist =
    finalHeaderUrl !== null ||
    finalFooterUrl !== null ||
    finalFaviconUrl !== null;

  if (needsBrandPersist) {
    const { error: brandErr } = await supabase
      .from("dealerships")
      .update({
        logo_url: finalHeaderUrl,
        theme_config: mergedTheme,
      })
      .eq("id", dealershipId);

    if (brandErr) {
      await supabase.from("dealerships").delete().eq("id", dealershipId);
      return { error: friendlyDealershipDbError(brandErr.message) };
    }
  }

  const syncUnitsResult = await syncDealershipUnits(
    supabase,
    dealershipId,
    unitsParsed.units,
  );
  if (syncUnitsResult.error) {
    await supabase.from("dealerships").delete().eq("id", dealershipId);
    return { error: syncUnitsResult.error };
  }

  REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
  return { success: true };
}

export async function updateDealershipAction(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const cnpj = String(formData.get("cnpj") ?? "").trim();
  const customDomain = String(formData.get("custom_domain") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const whatsapp = String(formData.get("whatsapp_number") ?? "").trim();
  const primary = String(formData.get("primary_color") ?? "").trim();
  const secondary = String(formData.get("secondary_color") ?? "").trim();
  const primaryFg = String(formData.get("primary_foreground") ?? "").trim();
  const status = String(formData.get("status") ?? "active").trim();

  if (name.length < 2) {
    return {
      error: "Nome da concessionária é obrigatório (mínimo 2 caracteres).",
    };
  }
  if (!SLUG_RE.test(slug)) {
    return {
      error:
        "Subdomínio inválido. Use apenas letras minúsculas, números e hífens (ex.: minha-loja).",
    };
  }
  if (!HEX_RE.test(primary) || !HEX_RE.test(primaryFg) || !HEX_RE.test(secondary)) {
    return {
      error:
        "Escolha cores válidas em formato hexadecimal (#RRGGBB), usando o seletor ao lado.",
    };
  }

  const allowedStatus = new Set([
    "active",
    "suspended",
    "pending_setup",
    "churned",
  ]);
  if (!allowedStatus.has(status)) {
    return { error: "Status inválido." };
  }

  const unitsParsed = parseUnitsPayload(formData.get("units_payload"));
  if (!unitsParsed.ok) {
    return { error: unitsParsed.error };
  }

  const cnpjDigits = digitsOnly(cnpj);
  if (cnpjDigits.length > 0 && cnpjDigits.length !== 14) {
    return {
      error:
        cnpjDigits.length < 14
          ? `${CNPJ_LENGTH_HINT} Faltam ${14 - cnpjDigits.length} número(s).`
          : `${CNPJ_LENGTH_HINT} Remova números a mais.`,
    };
  }

  const whatsappDigits = digitsOnly(whatsapp);
  if (
    whatsappDigits.length > 0 &&
    (whatsappDigits.length < 10 || whatsappDigits.length > 11)
  ) {
    return {
      error:
        "Telefone/WhatsApp inválido: informe DDD + número (10 ou 11 dígitos).",
    };
  }

  const emailNorm = contactEmail.trim().toLowerCase();
  const domainNorm = normalizeDomainHostname(customDomain);

  const supabase = createSupabaseServiceRoleClient();

  const { data: existing, error: loadErr } = await supabase
    .from("dealerships")
    .select("theme_settings, theme_config, content_config")
    .eq("id", id)
    .single();

  if (loadErr || !existing) {
    return { error: "Concessionária não encontrada." };
  }

  const theme_settings = mergeBrandColors(
    parseThemeSettings(existing.theme_settings),
    primary,
    primaryFg,
  );
  theme_settings.accent = secondary;

  const headingFont = parseGoogleFontField(formData, "google_font_heading");
  if (!headingFont.ok) {
    return { error: headingFont.error };
  }
  const bodyFont = parseGoogleFontField(formData, "google_font_body");
  if (!bodyFont.ok) {
    return { error: bodyFont.error };
  }

  const headerLogoFileRaw = formData.get("header_logo_file");
  const footerLogoFileRaw = formData.get("footer_logo_file");
  const faviconFileRaw = formData.get("favicon_file");

  let finalHeaderUrl = String(formData.get("header_logo_url") ?? "").trim() || null;
  let finalFooterUrl = String(formData.get("footer_logo_url") ?? "").trim() || null;
  let finalFaviconUrl = String(formData.get("favicon_url") ?? "").trim() || null;

  if (headerLogoFileRaw instanceof File && headerLogoFileRaw.size > 0) {
    const up = await uploadDealershipBrandAsset(supabase, id, "header_logo", headerLogoFileRaw);
    if (up.error) {
      return { error: up.error };
    }
    finalHeaderUrl = up.url ?? null;
  }

  if (footerLogoFileRaw instanceof File && footerLogoFileRaw.size > 0) {
    const up = await uploadDealershipBrandAsset(supabase, id, "footer_logo", footerLogoFileRaw);
    if (up.error) {
      return { error: up.error };
    }
    finalFooterUrl = up.url ?? null;
  }

  if (faviconFileRaw instanceof File && faviconFileRaw.size > 0) {
    const up = await uploadDealershipBrandAsset(supabase, id, "favicon", faviconFileRaw);
    if (up.error) {
      return { error: up.error };
    }
    finalFaviconUrl = up.url ?? null;
  }

  const theme_config: Record<string, unknown> = {
    ...parseRecord(existing.theme_config),
    primary_color: primary,
    secondary_color: secondary,
  };

  if (headingFont.family) {
    theme_config.google_font_heading = headingFont.family;
  } else {
    delete theme_config.google_font_heading;
  }
  if (bodyFont.family) {
    theme_config.google_font_body = bodyFont.family;
  } else {
    delete theme_config.google_font_body;
  }

  if (finalHeaderUrl) {
    theme_config.header_logo_url = finalHeaderUrl;
    theme_config.logo_url = finalHeaderUrl;
  } else {
    delete theme_config.header_logo_url;
    delete theme_config.logo_url;
  }

  if (finalFooterUrl) {
    theme_config.footer_logo_url = finalFooterUrl;
  } else {
    delete theme_config.footer_logo_url;
  }

  if (finalFaviconUrl) {
    theme_config.favicon_url = finalFaviconUrl;
  } else {
    delete theme_config.favicon_url;
  }

  const content_config = buildContentConfig(
    formData,
    parseRecord(existing.content_config),
  );

  const enabled_features = parseEnabledFeaturesFromForm(formData);
  const layout_id = parseLayoutIdFromForm(formData);
  const pricing_plan_id = parsePricingPlanIdFromForm(formData);

  const subscription_patch: { subscription_plan?: string } = {};
  const slugSync = await subscriptionPlanSlugForPricingPlan(
    supabase,
    pricing_plan_id,
  );
  if (pricing_plan_id !== null && slugSync !== null) {
    subscription_patch.subscription_plan = slugSync;
  }

  const { error } = await supabase
    .from("dealerships")
    .update({
      name,
      slug,
      cnpj: cnpjDigits.length === 14 ? cnpjDigits : null,
      custom_domain: domainNorm.length > 0 ? domainNorm : null,
      contact_email: emailNorm.length > 0 ? emailNorm : null,
      whatsapp_number: whatsappDigits.length > 0 ? whatsappDigits : null,
      logo_url: finalHeaderUrl,
      theme_settings,
      theme_config,
      content_config,
      enabled_features,
      status,
      layout_id,
      pricing_plan_id,
      ...subscription_patch,
    })
    .eq("id", id);

  if (error) {
    if (error.message.includes("unique") || error.code === "23505") {
      return {
        error: explainDealershipUniqueViolation(error?.message ?? ""),
      };
    }
    return { error: friendlyDealershipDbError(error.message) };
  }

  const syncUnitsResult = await syncDealershipUnits(supabase, id, unitsParsed.units);
  if (syncUnitsResult.error) {
    return { error: syncUnitsResult.error };
  }

  REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
  return { success: true };
}

export async function deleteDealershipAction(id: string): Promise<ActionResult> {
  await requireAdminSession();
  const supabase = createSupabaseServiceRoleClient();

  const { error } = await supabase.from("dealerships").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  REVALIDATE_PATHS.forEach((p) => revalidatePath(p));
  return { success: true };
}
