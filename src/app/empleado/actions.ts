"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uploadReceiptPhoto, validatePhotoFile } from "@/lib/supabase/storage";
import { minReportableDate, todayISODate } from "@/lib/week";
import type { Currency, ExpenseType } from "@/types/database";

export interface ExpenseFormState {
  error?: string;
}

function validateReportDate(date: string): string | null {
  if (date < minReportableDate()) {
    return "Solo puedes reportar gastos de hasta 5 semanas atrás.";
  }
  if (date > todayISODate()) {
    return "No puedes reportar gastos con fecha futura.";
  }
  return null;
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");
  return { supabase, user };
}

export async function createMealExpense(
  type: ExpenseType,
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const { supabase, user } = await requireUser();

  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "CRC") as Currency;
  const photo = formData.get("photo") as File | null;
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!date || !time) return { error: "Fecha y hora son obligatorias." };
  const dateError = validateReportDate(date);
  if (dateError) return { error: dateError };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "El monto debe ser mayor a cero." };
  }
  if (type === "CAJA_CHICA" && !description) {
    return { error: "Agrega una descripción del gasto." };
  }
  if (!photo || photo.size === 0) {
    return { error: "Debes adjuntar la foto del comprobante." };
  }
  const photoValidationError = validatePhotoFile(photo);
  if (photoValidationError) return { error: photoValidationError };

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      type,
      date,
      time,
      amount,
      currency,
      description,
      status: "REPORTADO",
    })
    .select("id")
    .single();

  if (expenseError || !expense) {
    return { error: expenseError?.message ?? "No se pudo registrar el gasto." };
  }

  try {
    const path = await uploadReceiptPhoto(supabase, user.id, expense.id, "comprobante", photo);
    const { error: photoError } = await supabase.from("expense_photos").insert({
      expense_id: expense.id,
      photo_type: "COMPROBANTE",
      file_url: path,
    });
    if (photoError) throw photoError;
  } catch (err) {
    await supabase.from("expenses").delete().eq("id", expense.id);
    return {
      error: err instanceof Error ? err.message : "No se pudo subir la fotografía.",
    };
  }

  revalidatePath("/empleado/mis-gastos");
  revalidatePath("/empleado");
  redirect(`/empleado/dia/${date}?creado=1`);
}

export async function createMileageExpense(
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const { supabase, user } = await requireUser();

  const date = String(formData.get("date") ?? "");
  const startPhoto = formData.get("start_photo") as File | null;
  const endPhoto = formData.get("end_photo") as File | null;

  if (!date) return { error: "La fecha es obligatoria." };
  const dateError = validateReportDate(date);
  if (dateError) return { error: dateError };
  if (!startPhoto || startPhoto.size === 0 || !endPhoto || endPhoto.size === 0) {
    return { error: "Debes adjuntar las fotos de inicio y fin del viaje." };
  }
  const startPhotoError = validatePhotoFile(startPhoto);
  if (startPhotoError) return { error: startPhotoError };
  const endPhotoError = validatePhotoFile(endPhoto);
  if (endPhotoError) return { error: endPhotoError };

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  // Simplificado a propósito: solo fecha + 2 fotos, sin lugares, horas ni
  // números de odómetro — por eso no se crea fila en `mileage` (no hay datos
  // que guardar ahí); las fotos quedan como evidencia del viaje.
  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      type: "KILOMETRAJE",
      date,
      time,
      amount: 0,
      currency: "CRC",
      status: "REPORTADO",
    })
    .select("id")
    .single();

  if (expenseError || !expense) {
    return { error: expenseError?.message ?? "No se pudo registrar el trayecto." };
  }

  try {
    const startPath = await uploadReceiptPhoto(
      supabase,
      user.id,
      expense.id,
      "inicio-viaje",
      startPhoto,
    );
    const endPath = await uploadReceiptPhoto(
      supabase,
      user.id,
      expense.id,
      "fin-viaje",
      endPhoto,
    );

    const { error: photosError } = await supabase.from("expense_photos").insert([
      { expense_id: expense.id, photo_type: "ODOMETRO_INICIAL", file_url: startPath },
      { expense_id: expense.id, photo_type: "ODOMETRO_FINAL", file_url: endPath },
    ]);
    if (photosError) throw photosError;
  } catch (err) {
    await supabase.from("expenses").delete().eq("id", expense.id);
    return {
      error: err instanceof Error ? err.message : "No se pudo guardar el trayecto.",
    };
  }

  revalidatePath("/empleado/mis-gastos");
  redirect("/empleado/mis-gastos?creado=1");
}

export async function createLodgingExpense(
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const { supabase, user } = await requireUser();

  const date = String(formData.get("date") ?? "");
  const nights = Number(formData.get("nights"));
  const photo = formData.get("photo") as File | null;

  if (!date) return { error: "La fecha es obligatoria." };
  const dateError = validateReportDate(date);
  if (dateError) return { error: dateError };
  if (!Number.isInteger(nights) || nights <= 0) {
    return { error: "Ingresa un número de noches válido." };
  }
  if (!photo || photo.size === 0) {
    return { error: "Debes adjuntar la foto de la factura." };
  }
  const photoValidationError = validatePhotoFile(photo);
  if (photoValidationError) return { error: photoValidationError };

  // El monto se calcula solo (noches x tarifa del hotel) — el hotel no lo
  // escribe, así el admin controla la tarifa desde el perfil del hotel.
  const { data: profile } = await supabase
    .from("profiles")
    .select("nightly_rate")
    .eq("id", user.id)
    .single();

  if (!profile?.nightly_rate || profile.nightly_rate <= 0) {
    return {
      error:
        "Este hotel no tiene una tarifa por noche configurada. Pídele al administrador que la agregue en Empleados.",
    };
  }

  const amount = Number((nights * profile.nightly_rate).toFixed(2));
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      type: "HOSPEDAJE",
      date,
      time,
      amount,
      currency: "CRC",
      nights,
      status: "REPORTADO",
    })
    .select("id")
    .single();

  if (expenseError || !expense) {
    return { error: expenseError?.message ?? "No se pudo registrar el hospedaje." };
  }

  try {
    const path = await uploadReceiptPhoto(supabase, user.id, expense.id, "factura", photo);
    const { error: photoError } = await supabase.from("expense_photos").insert({
      expense_id: expense.id,
      photo_type: "COMPROBANTE",
      file_url: path,
    });
    if (photoError) throw photoError;
  } catch (err) {
    await supabase.from("expenses").delete().eq("id", expense.id);
    return {
      error: err instanceof Error ? err.message : "No se pudo subir la fotografía.",
    };
  }

  revalidatePath("/empleado/mis-gastos");
  revalidatePath("/empleado");
  redirect(`/empleado/dia/${date}?creado=1`);
}
