"use server";

import { revalidatePath } from "next/cache";

import { requireDashboardSession } from "@/lib/dashboard/require-dashboard-session";
import { normalizePublicSlug } from "@/lib/inventory/normalize-public-slug";

const BUCKET = "vehicle-images";

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

export async function createVehicleAction(formData: FormData) {
  const { supabase, dealershipId } = await requireDashboardSession("/painel/estoque/novo");

  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const publicSlug = normalizePublicSlug(String(formData.get("public_slug") ?? ""));
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "available");
  const manufacturingYear = parseIntSafe(
    String(formData.get("manufacturing_year") ?? ""),
  );
  const modelYear = parseIntSafe(String(formData.get("model_year") ?? ""));
  const mileage = parseIntSafe(String(formData.get("mileage") ?? ""));
  const price = parsePrice(String(formData.get("price") ?? ""));

  if (!brand || !model || !publicSlug) {
    return { error: "Preencha marca, modelo e slug público." };
  }
  if (status !== "available" && status !== "sold") {
    return { error: "Status inválido." };
  }
  if (
    manufacturingYear === null ||
    modelYear === null ||
    mileage === null ||
    price === null
  ) {
    return { error: "Ano, quilometragem e preço devem ser números válidos." };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("vehicles")
    .insert({
      dealership_id: dealershipId,
      brand,
      model,
      manufacturing_year: manufacturingYear,
      model_year: modelYear,
      mileage,
      price,
      description: description.length > 0 ? description : null,
      status,
      public_slug: publicSlug,
      images: [],
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
      await supabase.from("vehicles").delete().eq("id", vehicleId);
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
    .select("id, images")
    .eq("id", vehicleId)
    .single();

  if (loadError || !existing) {
    return { error: "Veículo não encontrado." };
  }

  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const publicSlug = normalizePublicSlug(String(formData.get("public_slug") ?? ""));
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "available");
  const manufacturingYear = parseIntSafe(
    String(formData.get("manufacturing_year") ?? ""),
  );
  const modelYear = parseIntSafe(String(formData.get("model_year") ?? ""));
  const mileage = parseIntSafe(String(formData.get("mileage") ?? ""));
  const price = parsePrice(String(formData.get("price") ?? ""));

  if (!brand || !model || !publicSlug) {
    return { error: "Preencha marca, modelo e slug público." };
  }
  if (status !== "available" && status !== "sold") {
    return { error: "Status inválido." };
  }
  if (
    manufacturingYear === null ||
    modelYear === null ||
    mileage === null ||
    price === null
  ) {
    return { error: "Ano, quilometragem e preço devem ser números válidos." };
  }

  const { error: updateError } = await supabase
    .from("vehicles")
    .update({
      brand,
      model,
      manufacturing_year: manufacturingYear,
      model_year: modelYear,
      mileage,
      price,
      description: description.length > 0 ? description : null,
      status,
      public_slug: publicSlug,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vehicleId);

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
      .eq("id", vehicleId);
  }

  revalidatePath("/painel");
  revalidatePath("/painel/estoque");
  return { success: true as const };
}

export async function removeVehicleImageAction(vehicleId: string, imageUrl: string) {
  const { supabase } = await requireDashboardSession(`/painel/estoque/${vehicleId}/editar`);

  const path = storageObjectPathFromPublicUrl(imageUrl);
  if (path) {
    await supabase.storage.from(BUCKET).remove([path]);
  }

  const { data: row } = await supabase
    .from("vehicles")
    .select("images")
    .eq("id", vehicleId)
    .single();

  const next = ((row?.images as string[] | null) ?? []).filter((u) => u !== imageUrl);

  await supabase
    .from("vehicles")
    .update({
      images: next,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vehicleId);

  revalidatePath("/painel/estoque");
  revalidatePath(`/painel/estoque/${vehicleId}/editar`);
}

export async function deleteVehicleAction(vehicleId: string) {
  const { supabase, dealershipId } = await requireDashboardSession("/painel/estoque");

  const { error: leadsError } = await supabase
    .from("leads")
    .delete()
    .eq("vehicle_id", vehicleId);

  if (leadsError) {
    return { error: leadsError.message };
  }

  await removeAllImagesForVehicle(supabase, dealershipId, vehicleId);

  const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/painel");
  revalidatePath("/painel/estoque");
  revalidatePath("/painel/contatos");
  return { success: true as const };
}
