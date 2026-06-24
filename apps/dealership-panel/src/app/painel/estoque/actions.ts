"use server";

import { revalidatePath } from "next/cache";

import type { SocialPublicationChannel } from "@autopainel/shared/types/social-carousel";

import { publishVehicleToClassifiedsAction } from "@/app/painel/estoque/classified-actions";
import { enqueueVehicleSocialShareAction } from "@/app/painel/estoque/social-actions";
import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";
import { dispatchClassifiedsSyncWorker } from "@/lib/integrations/dispatch-classifieds-sync-worker";
import { delistClassifiedsBeforeVehicleDelete } from "@/lib/inventory/delist-classifieds-before-delete";
import { maybeAutoPublishVehicleToClassifieds } from "@/lib/inventory/maybe-auto-publish-classifieds-on-save";
import { normalizePublicSlug } from "@/lib/inventory/normalize-public-slug";
import {
  parseVehicleCatalogForm,
  vehicleCatalogToDbPayload,
} from "@/lib/inventory/parse-vehicle-catalog-form";
import {
  parseVehicleTypeSpecForm,
  vehicleTypeSpecToDbPayload,
} from "@/lib/inventory/parse-vehicle-type-spec-form";

const BUCKET = "vehicle-images";

async function runVehicleSavePromotions(vehicleId: string, formData: FormData) {
  if (formData.get("submit_intent") !== "save_and_promote") {
    return;
  }

  const socialChannels: SocialPublicationChannel[] = [];
  if (formData.get("promote_instagram") === "true") {
    socialChannels.push("instagram_feed");
  }
  if (formData.get("promote_facebook") === "true") {
    socialChannels.push("facebook_page");
  }
  if (socialChannels.length > 0) {
    await enqueueVehicleSocialShareAction(vehicleId, socialChannels, "vehicle_save");
  }

  const providers: Array<"olx" | "webmotors"> = [];
  if (formData.get("promote_olx") === "true") {
    providers.push("olx");
  }
  if (formData.get("promote_webmotors") === "true") {
    providers.push("webmotors");
  }
  if (providers.length > 0) {
    await publishVehicleToClassifiedsAction(vehicleId, providers);
  }
}

function storageObjectPathFromPublicUrl(publicUrl: string): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    return null;
  }
  const base = `${baseUrl}/storage/v1/object/public/${BUCKET}/`;
  if (!publicUrl.startsWith(base)) {
    return null;
  }
  return publicUrl.slice(base.length);
}

async function removeAllImagesForVehicle(
  supabase: Awaited<ReturnType<typeof requireDashboardSession>>["supabase"],
  dealershipId: string,
  vehicleId: string,
) {
  const folder = `${dealershipId}/${vehicleId}`;
  const { data: files } = await supabase.storage.from(BUCKET).list(folder, {
    limit: 100,
  });
  if (files?.length) {
    const paths = files.map((f) => `${folder}/${f.name}`);
    await supabase.storage.from(BUCKET).remove(paths);
  }
}

function parseIntSafe(value: string): number | null {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) {
    return null;
  }
  return n;
}

function parsePrice(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  const n = Number.parseFloat(normalized);
  if (Number.isNaN(n) || n < 0) {
    return null;
  }
  return n;
}

function parseOptionalPrice(value: string): number | null {
  if (!value.trim()) {
    return null;
  }
  return parsePrice(value);
}

function parseVehicleType(value: string): string | null {
  const allowed = new Set([
    "automovel",
    "motocicleta",
    "caminhonete",
    "van",
    "suv",
    "utilitario",
    "caminhao",
    "onibus",
    "outro",
  ]);
  return allowed.has(value) ? value : null;
}

export async function createVehicleAction(formData: FormData) {
  const { supabase, dealershipId } = await requireDashboardSession("/painel/estoque/novo");

  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const vehicleType = parseVehicleType(String(formData.get("vehicle_type") ?? "").trim());
  const vehicleTypeCustom = String(formData.get("vehicle_type_custom") ?? "").trim();
  const publicSlug = normalizePublicSlug(String(formData.get("public_slug") ?? ""));
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "available");
  const isActive = String(formData.get("is_active") ?? "true") !== "false";
  const isFeatured = String(formData.get("is_featured") ?? "").trim() === "true";
  const manufacturingYear = parseIntSafe(
    String(formData.get("manufacturing_year") ?? ""),
  );
  const modelYear = parseIntSafe(String(formData.get("model_year") ?? ""));
  const mileage = parseIntSafe(String(formData.get("mileage") ?? ""));
  const salePrice = parsePrice(String(formData.get("sale_price") ?? ""));
  const fipePrice = parseOptionalPrice(String(formData.get("fipe_price") ?? ""));
  const catalog = vehicleCatalogToDbPayload(parseVehicleCatalogForm(formData));
  const typeSpecs = vehicleTypeSpecToDbPayload(parseVehicleTypeSpecForm(formData));

  if (!brand || !model || !publicSlug) {
    return { error: "Preencha marca, modelo e slug público." };
  }
  if (!vehicleType) {
    return { error: "Tipo de veículo inválido." };
  }
  if (vehicleType === "outro" && !vehicleTypeCustom) {
    return { error: "Informe o tipo personalizado quando selecionar 'Outro'." };
  }
  if (status !== "available" && status !== "sold") {
    return { error: "Status inválido." };
  }
  if (
    manufacturingYear === null ||
    modelYear === null ||
    mileage === null ||
    salePrice === null
  ) {
    return { error: "Ano, quilometragem e preço devem ser números válidos." };
  }

  const dealershipUnitId = String(
    formData.get("dealership_unit_id") ?? "",
  ).trim();

  if (!dealershipUnitId) {
    return { error: "Selecione a unidade do estoque." };
  }

  const { data: unitOk } = await supabase
    .from("dealership_units")
    .select("id")
    .eq("id", dealershipUnitId)
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (!unitOk) {
    return { error: "Unidade inválida para esta concessionária." };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("vehicles")
    .insert({
      dealership_id: dealershipId,
      dealership_unit_id: dealershipUnitId,
      brand,
      model,
      manufacturing_year: manufacturingYear,
      model_year: modelYear,
      mileage,
      price: salePrice,
      sale_price: salePrice,
      fipe_price: fipePrice,
      vehicle_type: vehicleType,
      vehicle_type_custom: vehicleType === "outro" ? vehicleTypeCustom : null,
      is_active: isActive,
      is_featured: isFeatured,
      description: description.length > 0 ? description : null,
      status,
      public_slug: publicSlug,
      images: [],
      ...catalog,
      ...typeSpecs,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return {
      error:
        insertError?.message.includes("unique")
          ? "Este slug já está em uso nesta loja."
          : insertError?.message ?? "Não foi possível criar o veículo.",
    };
  }

  const vehicleId = inserted.id as string;
  const imageFiles = formData.getAll("images") as File[];
  const urls: string[] = [];

  for (const file of imageFiles) {
    if (!file || file.size === 0) {
      continue;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext ?? "")
      ? ext
      : "jpg";
    const path = `${dealershipId}/${vehicleId}/${crypto.randomUUID()}.${safeExt}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (upErr) {
      await removeAllImagesForVehicle(supabase, dealershipId, vehicleId);
      await supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicleId)
        .eq("dealership_id", dealershipId);
      return { error: `Falha ao enviar imagem: ${upErr.message}` };
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    urls.push(pub.publicUrl);
  }

  if (urls.length > 0) {
    await supabase
      .from("vehicles")
      .update({
        images: urls,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicleId);
  }

  await runVehicleSavePromotions(vehicleId, formData);
  await maybeAutoPublishVehicleToClassifieds(vehicleId, formData);

  revalidatePath("/painel");
  revalidatePath("/painel/estoque");
  return { success: true as const, vehicleId };
}

export async function updateVehicleAction(vehicleId: string, formData: FormData) {
  const { supabase, dealershipId } = await requireDashboardSession(
    `/painel/estoque/${vehicleId}/editar`,
  );

  const { data: existing, error: loadError } = await supabase
    .from("vehicles")
    .select("id, images, status, is_active")
    .eq("id", vehicleId)
    .eq("dealership_id", dealershipId)
    .single();

  if (loadError || !existing) {
    return { error: "Veículo não encontrado." };
  }

  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const vehicleType = parseVehicleType(String(formData.get("vehicle_type") ?? "").trim());
  const vehicleTypeCustom = String(formData.get("vehicle_type_custom") ?? "").trim();
  const publicSlug = normalizePublicSlug(String(formData.get("public_slug") ?? ""));
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "available");
  const isActive = String(formData.get("is_active") ?? "true") !== "false";
  const isFeatured = String(formData.get("is_featured") ?? "").trim() === "true";
  const manufacturingYear = parseIntSafe(
    String(formData.get("manufacturing_year") ?? ""),
  );
  const modelYear = parseIntSafe(String(formData.get("model_year") ?? ""));
  const mileage = parseIntSafe(String(formData.get("mileage") ?? ""));
  const salePrice = parsePrice(String(formData.get("sale_price") ?? ""));
  const fipePrice = parseOptionalPrice(String(formData.get("fipe_price") ?? ""));
  const catalog = vehicleCatalogToDbPayload(parseVehicleCatalogForm(formData));
  const typeSpecs = vehicleTypeSpecToDbPayload(parseVehicleTypeSpecForm(formData));

  if (!brand || !model || !publicSlug) {
    return { error: "Preencha marca, modelo e slug público." };
  }
  if (!vehicleType) {
    return { error: "Tipo de veículo inválido." };
  }
  if (vehicleType === "outro" && !vehicleTypeCustom) {
    return { error: "Informe o tipo personalizado quando selecionar 'Outro'." };
  }
  if (status !== "available" && status !== "sold") {
    return { error: "Status inválido." };
  }
  if (
    manufacturingYear === null ||
    modelYear === null ||
    mileage === null ||
    salePrice === null
  ) {
    return { error: "Ano, quilometragem e preço devem ser números válidos." };
  }

  const dealershipUnitId = String(
    formData.get("dealership_unit_id") ?? "",
  ).trim();

  if (!dealershipUnitId) {
    return { error: "Selecione a unidade do estoque." };
  }

  const { data: unitOk } = await supabase
    .from("dealership_units")
    .select("id")
    .eq("id", dealershipUnitId)
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (!unitOk) {
    return { error: "Unidade inválida para esta concessionária." };
  }

  const { error: updateError } = await supabase
    .from("vehicles")
    .update({
      brand,
      model,
      manufacturing_year: manufacturingYear,
      model_year: modelYear,
      mileage,
      price: salePrice,
      sale_price: salePrice,
      fipe_price: fipePrice,
      vehicle_type: vehicleType,
      vehicle_type_custom: vehicleType === "outro" ? vehicleTypeCustom : null,
      is_active: isActive,
      is_featured: isFeatured,
      description: description.length > 0 ? description : null,
      status,
      public_slug: publicSlug,
      dealership_unit_id: dealershipUnitId,
      updated_at: new Date().toISOString(),
      ...catalog,
      ...typeSpecs,
    })
    .eq("id", vehicleId)
    .eq("dealership_id", dealershipId);

  if (updateError) {
    return {
      error: updateError.message.includes("unique")
        ? "Este slug já está em uso nesta loja."
        : updateError.message,
    };
  }

  const imageFiles = formData.getAll("new_images") as File[];
  const currentUrls = [...((existing.images as string[] | null) ?? [])];

  for (const file of imageFiles) {
    if (!file || file.size === 0) {
      continue;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext ?? "")
      ? ext
      : "jpg";
    const path = `${dealershipId}/${vehicleId}/${crypto.randomUUID()}.${safeExt}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (upErr) {
      return { error: `Falha ao enviar imagem: ${upErr.message}` };
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    currentUrls.push(pub.publicUrl);
  }

  if (imageFiles.some((f) => f?.size > 0)) {
    await supabase
      .from("vehicles")
      .update({
        images: currentUrls,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicleId)
      .eq("dealership_id", dealershipId);
  }

  const shouldDispatchClassifiedsDelist =
    existing.status !== status ||
    Boolean(existing.is_active) !== isActive;

  if (shouldDispatchClassifiedsDelist) {
    await dispatchClassifiedsSyncWorker(3);
  }

  await runVehicleSavePromotions(vehicleId, formData);
  await maybeAutoPublishVehicleToClassifieds(vehicleId, formData);

  revalidatePath("/painel");
  revalidatePath("/painel/estoque");
  revalidatePath(`/painel/estoque/${vehicleId}`);
  return { success: true as const };
}

export async function removeVehicleImageAction(vehicleId: string, imageUrl: string) {
  const { supabase, dealershipId } = await requireDashboardSession(
    `/painel/estoque/${vehicleId}/editar`,
  );

  const path = storageObjectPathFromPublicUrl(imageUrl);
  if (path) {
    await supabase.storage.from(BUCKET).remove([path]);
  }

  const { data: row } = await supabase
    .from("vehicles")
    .select("images")
    .eq("id", vehicleId)
    .eq("dealership_id", dealershipId)
    .single();

  const next = ((row?.images as string[] | null) ?? []).filter((u) => u !== imageUrl);

  await supabase
    .from("vehicles")
    .update({
      images: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vehicleId)
    .eq("dealership_id", dealershipId);

  revalidatePath("/painel/estoque");
  revalidatePath(`/painel/estoque/${vehicleId}/editar`);
}

export async function markVehicleAsSoldAction(vehicleId: string) {
  const { supabase, dealershipId } = await requireDashboardSession(
    `/painel/estoque/${vehicleId}`,
  );

  const { data: existing, error: loadError } = await supabase
    .from("vehicles")
    .select("id, status")
    .eq("id", vehicleId)
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (loadError || !existing) {
    return { error: "Veículo não encontrado." };
  }

  if (existing.status === "sold") {
    return { error: "Este veículo já está marcado como vendido." };
  }

  const { error: updateError } = await supabase
    .from("vehicles")
    .update({
      status: "sold",
      updated_at: new Date().toISOString(),
    })
    .eq("id", vehicleId)
    .eq("dealership_id", dealershipId);

  if (updateError) {
    return { error: "Não foi possível marcar o veículo como vendido. Tente novamente." };
  }

  await dispatchClassifiedsSyncWorker(3);

  revalidatePath("/painel");
  revalidatePath("/painel/estoque");
  revalidatePath(`/painel/estoque/${vehicleId}`);
  revalidatePath(`/painel/estoque/${vehicleId}/editar`);
  revalidatePath(`/painel/estoque/${vehicleId}/recibo`);

  return { success: true as const };
}

export async function unmarkVehicleAsSoldAction(vehicleId: string) {
  const { supabase, dealershipId } = await requireDashboardSession(
    `/painel/estoque/${vehicleId}`,
  );

  const { data: existing, error: loadError } = await supabase
    .from("vehicles")
    .select("id, status")
    .eq("id", vehicleId)
    .eq("dealership_id", dealershipId)
    .maybeSingle();

  if (loadError || !existing) {
    return { error: "Veículo não encontrado." };
  }

  if (existing.status !== "sold") {
    return { error: "Este veículo não está marcado como vendido." };
  }

  const { error: updateError } = await supabase
    .from("vehicles")
    .update({
      status: "available",
      updated_at: new Date().toISOString(),
    })
    .eq("id", vehicleId)
    .eq("dealership_id", dealershipId);

  if (updateError) {
    return { error: "Não foi possível desfazer a venda. Tente novamente." };
  }

  revalidatePath("/painel");
  revalidatePath("/painel/estoque");
  revalidatePath(`/painel/estoque/${vehicleId}`);
  revalidatePath(`/painel/estoque/${vehicleId}/editar`);
  revalidatePath(`/painel/estoque/${vehicleId}/recibo`);

  return { success: true as const };
}

export async function deleteVehicleAction(vehicleId: string) {
  const { supabase, dealershipId } = await requireDashboardSession("/painel/estoque");

  await delistClassifiedsBeforeVehicleDelete(vehicleId);

  const { error: leadsError } = await supabase
    .from("leads")
    .delete()
    .eq("vehicle_id", vehicleId)
    .eq("dealership_id", dealershipId);

  if (leadsError) {
    return { error: leadsError.message };
  }

  await removeAllImagesForVehicle(supabase, dealershipId, vehicleId);

  const { error } = await supabase
    .from("vehicles")
    .delete()
    .eq("id", vehicleId)
    .eq("dealership_id", dealershipId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/painel");
  revalidatePath("/painel/estoque");
  revalidatePath("/painel/contatos");
  return { success: true as const };
}

export async function updateFeaturedSortOrderAction(
  vehicleId: string,
  featuredSortOrder: number | null,
): Promise<{ error?: string; success?: boolean }> {
  const { supabase, profile, dealershipId } = await requireDashboardSession();

  const canManage =
    profile.role === "owner" ||
    profile.role === "manager" ||
    profile.role === "super_admin";
  if (!canManage) {
    return { error: "Somente gestores podem alterar a ordem dos destaques." };
  }

  const { error } = await supabase.rpc("update_vehicle_featured_sort_orders", {
    p_updates: [
      {
        vehicle_id: vehicleId,
        featured_sort_order: featuredSortOrder,
      },
    ],
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/painel/estoque");
  return { success: true };
}
