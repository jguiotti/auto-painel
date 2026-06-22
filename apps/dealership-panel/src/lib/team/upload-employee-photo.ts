import type { SupabaseClient } from "@supabase/supabase-js";

const BRANDING_BUCKET = "dealership-branding";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extensionFromMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

function validateEmployeePhotoFile(file: File): string | null {
  if (file.size > MAX_BYTES) {
    return "A foto deve ter no máximo 2 MB.";
  }
  const mime = file.type || "image/jpeg";
  if (!ALLOWED_MIME.has(mime)) {
    return "Formato inválido. Use PNG, JPG, WebP ou GIF.";
  }
  return null;
}

export async function uploadEmployeePhoto(
  supabase: SupabaseClient,
  params: { dealershipId: string; userId: string; file: File },
): Promise<{ url: string } | { error: string }> {
  const validationError = validateEmployeePhotoFile(params.file);
  if (validationError) {
    return { error: validationError };
  }

  const ext = extensionFromMime(params.file.type || "image/jpeg");
  const path = `${params.dealershipId}/employees/${params.userId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BRANDING_BUCKET)
    .upload(path, params.file, {
      contentType: params.file.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    return { error: `Falha ao enviar a foto: ${uploadError.message}` };
  }

  const { data } = supabase.storage.from(BRANDING_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
