"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { uploadReceiptPhoto, validatePhotoFile } from "@/lib/supabase/storage";
import type { Currency, ExpenseType } from "@/types/database";

export interface ExpenseFormState {
  error?: string;
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

  if (!date || !time) return { error: "Fecha y hora son obligatorias." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "El monto debe ser mayor a cero." };
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
  const start_location = String(formData.get("start_location") ?? "").trim();
  const end_location = String(formData.get("end_location") ?? "").trim();
  const start_time = String(formData.get("start_time") ?? "");
  const end_time = String(formData.get("end_time") ?? "");
  const initial_odometer = Number(formData.get("initial_odometer"));
  const final_odometer = Number(formData.get("final_odometer"));
  const description = String(formData.get("description") ?? "").trim() || null;
  const startPhoto = formData.get("start_photo") as File | null;
  const endPhoto = formData.get("end_photo") as File | null;

  if (!date || !start_time || !end_time || !start_location || !end_location) {
    return { error: "Completa fecha, horas y lugares." };
  }
  if (!Number.isFinite(initial_odometer) || !Number.isFinite(final_odometer)) {
    return { error: "El kilometraje inicial y final son obligatorios." };
  }
  if (final_odometer <= initial_odometer) {
    return { error: "El kilometraje final debe ser mayor al inicial." };
  }
  if (!startPhoto || startPhoto.size === 0 || !endPhoto || endPhoto.size === 0) {
    return { error: "Debes adjuntar las fotos de odómetro inicial y final." };
  }
  const startPhotoError = validatePhotoFile(startPhoto);
  if (startPhotoError) return { error: startPhotoError };
  const endPhotoError = validatePhotoFile(endPhoto);
  if (endPhotoError) return { error: endPhotoError };

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      type: "KILOMETRAJE",
      date,
      time: start_time,
      amount: 0,
      currency: "CRC",
      description,
      status: "REPORTADO",
    })
    .select("id")
    .single();

  if (expenseError || !expense) {
    return { error: expenseError?.message ?? "No se pudo registrar el trayecto." };
  }

  try {
    const { error: mileageError } = await supabase.from("mileage").insert({
      expense_id: expense.id,
      start_location,
      end_location,
      start_time,
      end_time,
      initial_odometer,
      final_odometer,
    });
    if (mileageError) throw mileageError;

    const startPath = await uploadReceiptPhoto(
      supabase,
      user.id,
      expense.id,
      "odometro-inicial",
      startPhoto,
    );
    const endPath = await uploadReceiptPhoto(
      supabase,
      user.id,
      expense.id,
      "odometro-final",
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
