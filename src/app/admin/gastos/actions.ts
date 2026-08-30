"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { uploadReceiptPhoto, validatePhotoFile } from "@/lib/supabase/storage";
import type { Currency, ExpenseType } from "@/types/database";

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
  return user;
}

export async function approveExpense(id: string) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("expenses")
    .update({ status: "APROBADO", rejection_reason: null })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/gastos");
}

export async function rejectExpense(id: string, reason: string) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("expenses")
    .update({ status: "RECHAZADO", rejection_reason: reason || "Sin motivo especificado." })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/gastos");
}

export async function deleteExpenseAdmin(id: string) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/gastos");
}

export interface ExpenseEditState {
  error?: string;
  ok?: boolean;
}

export async function updateExpenseAdmin(
  _prevState: ExpenseEditState,
  formData: FormData,
): Promise<ExpenseEditState> {
  await assertIsAdmin();

  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "CRC") as Currency;
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!id || !date || !time) return { error: "Fecha y hora son obligatorias." };
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: "El monto no puede ser negativo." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("expenses")
    .update({ date, time, amount, currency, description })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/gastos");
  return { ok: true };
}

export interface ManualExpenseState {
  error?: string;
  ok?: boolean;
}

export async function createExpenseManual(
  _prevState: ManualExpenseState,
  formData: FormData,
): Promise<ManualExpenseState> {
  await assertIsAdmin();

  const admin = createAdminClient();
  const type = String(formData.get("type") ?? "") as ExpenseType;
  const user_id = String(formData.get("user_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!type || !user_id || !date || !time) {
    return { error: "Tipo, empleado, fecha y hora son obligatorios." };
  }

  if (type === "KILOMETRAJE") {
    const start_location = String(formData.get("start_location") ?? "").trim();
    const end_location = String(formData.get("end_location") ?? "").trim();
    const start_time = String(formData.get("start_time") ?? time);
    const end_time = String(formData.get("end_time") ?? time);
    const initial_odometer = Number(formData.get("initial_odometer"));
    const final_odometer = Number(formData.get("final_odometer"));

    if (!start_location || !end_location) {
      return { error: "Lugar de inicio y destino son obligatorios." };
    }
    if (
      !Number.isFinite(initial_odometer) ||
      !Number.isFinite(final_odometer) ||
      final_odometer <= initial_odometer
    ) {
      return { error: "El kilometraje final debe ser mayor al inicial." };
    }

    const { data: expense, error: expenseError } = await admin
      .from("expenses")
      .insert({
        user_id,
        type,
        date,
        time,
        amount: 0,
        currency: "CRC",
        description,
        status: "APROBADO",
      })
      .select("id")
      .single();

    if (expenseError || !expense) {
      return { error: expenseError?.message ?? "No se pudo crear el gasto." };
    }

    const { error: mileageError } = await admin.from("mileage").insert({
      expense_id: expense.id,
      start_location,
      end_location,
      start_time,
      end_time,
      initial_odometer,
      final_odometer,
    });

    if (mileageError) {
      await admin.from("expenses").delete().eq("id", expense.id);
      return { error: mileageError.message };
    }

    revalidatePath("/admin/gastos");
    return { ok: true };
  }

  const amount = Number(formData.get("amount"));
  const currency = String(formData.get("currency") ?? "CRC") as Currency;
  const photo = formData.get("photo") as File | null;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "El monto debe ser mayor a cero." };
  }

  const { data: expense, error: expenseError } = await admin
    .from("expenses")
    .insert({
      user_id,
      type,
      date,
      time,
      amount,
      currency,
      description,
      status: "APROBADO",
    })
    .select("id")
    .single();

  if (expenseError || !expense) {
    return { error: expenseError?.message ?? "No se pudo crear el gasto." };
  }

  if (photo && photo.size > 0) {
    const photoValidationError = validatePhotoFile(photo);
    if (photoValidationError) return { error: photoValidationError };

    try {
      const path = await uploadReceiptPhoto(admin, user_id, expense.id, "comprobante", photo);
      const { error: photoError } = await admin.from("expense_photos").insert({
        expense_id: expense.id,
        photo_type: "COMPROBANTE",
        file_url: path,
      });
      if (photoError) throw photoError;
    } catch (err) {
      // El gasto ya quedó creado sin foto; no se revierte por un detalle no
      // crítico como el comprobante en creación manual.
      return {
        error:
          err instanceof Error
            ? `Gasto creado, pero falló la foto: ${err.message}`
            : "Gasto creado, pero falló subir la foto.",
      };
    }
  }

  revalidatePath("/admin/gastos");
  return { ok: true };
}
