"use server";

import { digitsOnly } from "@autopainel/shared/lib/br/format-input-masks";
import {
  mapOnboardingIntakeRpcError,
  mapOnboardingIntakeUploadError,
} from "@autopainel/shared/lib/dealership/onboarding-intake-errors";
import { validateOnboardingIntakePayload } from "@autopainel/shared/lib/dealership/validate-onboarding-intake-step";
import { createSupabaseServiceRoleClient } from "@autopainel/shared/lib/supabase/service-role";
import { createSupabaseAnonClient } from "@autopainel/shared/lib/supabase";
import type { DealershipOnboardingIntakePayload } from "@autopainel/shared/types";

import { PRIVACY_POLICY_VERSION } from "@/lib/legal/constants";
import { TRIAL_ADHESION_VERSION } from "@/lib/legal/trial-constants";
import { fetchTrialCampaignAvailability } from "@/lib/fetch-trial-campaign-availability";
import { sendTrialOnboardingEmail } from "@/lib/email/send-trial-onboarding-email";

export interface SubmitTrialOnboardingState {
  success?: boolean;
  waitlisted?: boolean;
  error?: string;
  intakeId?: string;
}

const ONBOARDING_BUCKET = "dealership-onboarding-intakes";
const MAX_BRAND_BYTES = 2 * 1024 * 1024;
const MAX_HERO_BYTES = 5 * 1024 * 1024;
const ALLOWED_BRAND_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const ALLOWED_HERO_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

async function uploadIntakeAsset(
  intakeId: string,
  file: File,
  kind: string,
  maxBytes: number,
  allowedMime: Set<string>,
): Promise<{ url?: string; error?: string }> {
  if (file.size > maxBytes) {
    return { error: mapOnboardingIntakeUploadError(kind, "size") };
  }
  if (!allowedMime.has(file.type)) {
    return { error: mapOnboardingIntakeUploadError(kind, "format") };
  }

  let supabase;
  try {
    supabase = createSupabaseServiceRoleClient();
  } catch {
    return { error: "Upload indisponível no momento. Tente novamente mais tarde." };
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const path = `${intakeId}/${kind}.${ext}`;

  const { error: upErr } = await supabase.storage.from(ONBOARDING_BUCKET).upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });

  if (upErr) {
    return { error: mapOnboardingIntakeUploadError(kind, "upload") };
  }

  const { data: pub } = supabase.storage.from(ONBOARDING_BUCKET).getPublicUrl(path);
  return { url: pub.publicUrl };
}

function parsePayload(raw: string): DealershipOnboardingIntakePayload | null {
  try {
    return JSON.parse(raw) as DealershipOnboardingIntakePayload;
  } catch {
    return null;
  }
}

function normalizePayload(payload: DealershipOnboardingIntakePayload): DealershipOnboardingIntakePayload {
  return {
    ...payload,
    general: {
      ...payload.general,
      cnpj: digitsOnly(payload.general.cnpj),
      whatsapp: digitsOnly(payload.general.whatsapp),
      legal_representative_cpf: digitsOnly(payload.general.legal_representative_cpf),
      slug: payload.general.slug.trim().toLowerCase(),
      contact_email: payload.general.contact_email.trim(),
    },
    units: (payload.units ?? []).map((unit) => ({
      ...unit,
      whatsapp_number: digitsOnly(unit.whatsapp_number),
    })),
  };
}

export async function submitTrialOnboardingAction(
  _prev: SubmitTrialOnboardingState | null,
  formData: FormData,
): Promise<SubmitTrialOnboardingState> {
  const payloadRaw = String(formData.get("payload_json") ?? "");
  const trialAccepted = formData.get("trial_accepted") === "true";
  const privacyAccepted = formData.get("privacy_accepted") === "true";
  const dataProcessingAccepted = formData.get("data_processing_accepted") === "true";
  const marketingConsent = formData.get("marketing_consent") === "true";
  const saasProspectIdRaw = String(formData.get("saas_prospect_id") ?? "").trim();

  if (!trialAccepted) {
    return { error: "Aceite o Termo de Adesão ao Trial para continuar." };
  }
  if (!privacyAccepted) {
    return { error: "Aceite a Política de Privacidade da AutoPainel." };
  }
  if (!dataProcessingAccepted) {
    return {
      error:
        "É necessário autorizar o tratamento e a detenção dos dados de clientes e leads pela AutoPainel.",
    };
  }

  const parsed = parsePayload(payloadRaw);
  if (!parsed?.general?.store_name?.trim()) {
    return { error: "Informe o nome da loja." };
  }

  const payload = normalizePayload(parsed);
  const validationError = validateOnboardingIntakePayload(payload);
  if (validationError) {
    return { error: validationError };
  }

  const availability = await fetchTrialCampaignAvailability();
  const isWaitlist = !availability.acceptsImmediateTrial;
  payload.campaign = {
    trial_waitlist: isWaitlist,
    setup_fee_waived: !isWaitlist,
  };

  let supabaseAnon;
  try {
    supabaseAnon = createSupabaseAnonClient();
  } catch {
    return { error: "Configuração do servidor incompleta. Tente mais tarde." };
  }

  const nowIso = new Date().toISOString();
  const saasProspectId =
    saasProspectIdRaw.length > 0 && /^[0-9a-f-]{36}$/i.test(saasProspectIdRaw)
      ? saasProspectIdRaw
      : null;

  const { data: intakeId, error: rpcError } = await supabaseAnon.rpc(
    "submit_dealership_onboarding_intake",
    {
      p_payload: payload,
      p_trial_legal_version: TRIAL_ADHESION_VERSION,
      p_trial_accepted_at: nowIso,
      p_saas_prospect_id: saasProspectId,
    },
  );

  if (rpcError || !intakeId) {
    return {
      error: mapOnboardingIntakeRpcError(rpcError?.message ?? ""),
    };
  }

  const id = String(intakeId);
  const assetFields: Array<{
    formKey: string;
    kind: string;
    maxBytes: number;
    allowed: Set<string>;
    target: (url: string) => void;
  }> = [
    {
      formKey: "logo_dark_file",
      kind: "logo-dark",
      maxBytes: MAX_BRAND_BYTES,
      allowed: ALLOWED_BRAND_MIME,
      target: (url) => {
        payload.branding.logo_dark_url = url;
      },
    },
    {
      formKey: "logo_light_file",
      kind: "logo-light",
      maxBytes: MAX_BRAND_BYTES,
      allowed: ALLOWED_BRAND_MIME,
      target: (url) => {
        payload.branding.logo_light_url = url;
      },
    },
    {
      formKey: "footer_logo_file",
      kind: "footer-logo",
      maxBytes: MAX_BRAND_BYTES,
      allowed: ALLOWED_BRAND_MIME,
      target: (url) => {
        payload.branding.footer_logo_url = url;
      },
    },
    {
      formKey: "favicon_file",
      kind: "favicon",
      maxBytes: MAX_BRAND_BYTES,
      allowed: ALLOWED_BRAND_MIME,
      target: (url) => {
        payload.branding.favicon_url = url;
      },
    },
    {
      formKey: "hero_background_file",
      kind: "hero-background",
      maxBytes: MAX_HERO_BYTES,
      allowed: ALLOWED_HERO_MIME,
      target: (url) => {
        payload.storefront.hero_background_url = url;
      },
    },
  ];

  for (const field of assetFields) {
    const file = formData.get(field.formKey);
    if (!(file instanceof File) || file.size === 0) {
      continue;
    }
    const uploaded = await uploadIntakeAsset(
      id,
      file,
      field.kind,
      field.maxBytes,
      field.allowed,
    );
    if (uploaded.error) {
      return { error: uploaded.error };
    }
    if (uploaded.url) {
      field.target(uploaded.url);
    }
  }

  try {
    const supabaseService = createSupabaseServiceRoleClient();

    await supabaseService.rpc("update_dealership_onboarding_intake_payload", {
      p_intake_id: id,
      p_payload: payload as unknown as Record<string, unknown>,
    });

    if (!saasProspectId) {
      const { data: prospectRow } = await supabaseService
        .from("saas_prospects")
        .insert({
          full_name: payload.general.legal_representative_name || payload.general.store_name,
          email: payload.general.contact_email,
          phone: payload.general.whatsapp || null,
          company_name: payload.general.store_name,
          message: isWaitlist
            ? `Fila de espera trial — intake ${id}`
            : `Formulário de adesão trial — intake ${id}`,
          source: "trial_onboarding",
          metadata: {
            intake_id: id,
            privacy_policy_version: PRIVACY_POLICY_VERSION,
            trial_adhesion_version: TRIAL_ADHESION_VERSION,
            lead_channel: "trial_onboarding",
            trial_waitlist: isWaitlist,
            setup_fee_waived: !isWaitlist,
          },
          privacy_policy_accepted_at: nowIso,
          privacy_policy_version: PRIVACY_POLICY_VERSION,
          marketing_consent: marketingConsent,
          marketing_consent_at: marketingConsent ? nowIso : null,
          pipeline_status: isWaitlist ? "qualification" : "onboarding",
        })
        .select("id")
        .single();

      if (prospectRow?.id) {
        await supabaseService
          .from("dealership_onboarding_intakes")
          .update({
            saas_prospect_id: prospectRow.id,
            status: "linked",
            updated_at: nowIso,
          })
          .eq("id", id);
      }
    }
  } catch {
    // Intake saved; prospect sync is best-effort
  }

  try {
    await sendTrialOnboardingEmail({
      to: payload.general.contact_email,
      recipientName:
        payload.general.legal_representative_name?.trim() ||
        payload.general.store_name.trim(),
      storeName: payload.general.store_name.trim(),
      isWaitlist,
    });
  } catch {
    // TRIAL-01/02 are best-effort; intake success must not fail on e-mail
  }

  return { success: true, waitlisted: isWaitlist, intakeId: id };
}
