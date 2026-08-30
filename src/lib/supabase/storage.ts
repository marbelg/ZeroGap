import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const RECEIPTS_BUCKET = "receipts";
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB

export function validatePhotoFile(file: File): string | null {
  if (file.size > MAX_PHOTO_BYTES) return "La foto no puede pesar más de 10 MB.";
  if (file.type && !file.type.startsWith("image/")) {
    return "El archivo debe ser una imagen.";
  }
  return null;
}

export async function uploadReceiptPhoto(
  supabase: SupabaseClient<Database>,
  userId: string,
  expenseId: string,
  fileNamePrefix: string,
  file: File,
) {
  const rawExtension = file.name.split(".").pop() ?? "";
  // Solo a-z0-9, máximo 5 caracteres — el nombre de archivo lo controla el
  // usuario, no confiar en él para construir la ruta en Storage.
  const extension = /^[a-z0-9]{1,5}$/i.test(rawExtension) ? rawExtension.toLowerCase() : "jpg";
  const path = `${userId}/${expenseId}/${fileNamePrefix}.${extension}`;

  const { error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });

  if (error) throw error;
  return path;
}

export async function getReceiptSignedUrl(
  supabase: SupabaseClient<Database>,
  path: string,
  expiresInSeconds = 3600,
) {
  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) return null;
  return data.signedUrl;
}

export async function getReceiptSignedUrls(
  supabase: SupabaseClient<Database>,
  paths: string[],
) {
  if (paths.length === 0) return {} as Record<string, string>;

  const { data, error } = await supabase.storage
    .from(RECEIPTS_BUCKET)
    .createSignedUrls(paths, 3600);

  if (error || !data) return {} as Record<string, string>;

  return Object.fromEntries(
    data
      .filter((entry) => entry.signedUrl && entry.path)
      .map((entry) => [entry.path as string, entry.signedUrl]),
  ) as Record<string, string>;
}
