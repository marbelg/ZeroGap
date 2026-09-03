"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AppSettings } from "@/types/database";

async function assertIsAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "ADMIN") throw new Error("No autorizado.");
}

export interface SettingsFormState {
  error?: string;
  ok?: boolean;
}

function parseMoney(formData: FormData, key: string): number {
  const value = Number(formData.get(key));
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

const LOGO_BUCKET = "branding";
const MAX_LOGO_BYTES = 5 * 1024 * 1024; // 5 MB

async function uploadLogo(file: File): Promise<{ url?: string; error?: string }> {
  if (file.size > MAX_LOGO_BYTES) return { error: "El logo no puede pesar más de 5 MB." };
  if (file.type && !file.type.startsWith("image/")) {
    return { error: "El logo debe ser una imagen." };
  }

  const rawExtension = file.name.split(".").pop() ?? "";
  // Igual que con los comprobantes: no confiar en el nombre de archivo del
  // cliente para construir la ruta en Storage.
  const extension = /^[a-z0-9]{1,5}$/i.test(rawExtension) ? rawExtension.toLowerCase() : "png";
  const path = `logo.${extension}`;

  const admin = createAdminClient();
  const { error } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || "image/png" });

  if (error) return { error: error.message };

  const { data } = admin.storage.from(LOGO_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function updateSettings(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await assertIsAdmin();

  const weekly_budget_total = parseMoney(formData, "weekly_budget_total");
  const weekly_budget_desayuno = parseMoney(formData, "weekly_budget_desayuno");
  const weekly_budget_almuerzo = parseMoney(formData, "weekly_budget_almuerzo");
  const weekly_budget_cena = parseMoney(formData, "weekly_budget_cena");
  const km_rate = parseMoney(formData, "km_rate");
  const payment_day_of_week = Math.min(6, Math.max(0, Number(formData.get("payment_day_of_week")) || 0));
  const monthly_budget_caja_chica = parseMoney(formData, "monthly_budget_caja_chica");
  const monthly_budget_no_directo = parseMoney(formData, "monthly_budget_no_directo");
  const locale_en_enabled = formData.get("locale_en_enabled") === "on";
  const locale_fr_enabled = formData.get("locale_fr_enabled") === "on";

  const update: Partial<AppSettings> = {
    weekly_budget_total,
    weekly_budget_desayuno,
    weekly_budget_almuerzo,
    weekly_budget_cena,
    km_rate,
    payment_day_of_week,
    monthly_budget_caja_chica,
    monthly_budget_no_directo,
    locale_en_enabled,
    locale_fr_enabled,
  };

  const removeLogo = formData.get("remove_logo") === "on";
  const logoFile = formData.get("logo");
  if (removeLogo) {
    update.logo_url = null;
  } else if (logoFile instanceof File && logoFile.size > 0) {
    const { url, error } = await uploadLogo(logoFile);
    if (error) return { error };
    update.logo_url = url;
  }

  const admin = createAdminClient();
  const { error } = await admin.from("app_settings").update(update).eq("id", true);

  if (error) return { error: error.message };

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/gastos");
  revalidatePath("/admin");
  revalidatePath("/empleado");
  revalidatePath("/login");
  return { ok: true };
}
