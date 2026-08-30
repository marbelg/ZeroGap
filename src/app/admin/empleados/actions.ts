"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";

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

function generateTempPassword() {
  // 10 caracteres legibles (sin ambigüedades tipo 0/O, 1/l).
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(10);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

export interface EmployeeFormState {
  error?: string;
  tempPassword?: string;
}

export async function createEmployee(
  _prevState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  await assertIsAdmin();

  const first_name = String(formData.get("first_name") ?? "").trim();
  const last_name = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const department = String(formData.get("department") ?? "").trim() || null;
  const position = String(formData.get("position") ?? "").trim() || null;
  const employee_code = String(formData.get("employee_code") ?? "").trim() || null;
  const role = (formData.get("role") === "ADMIN" ? "ADMIN" : "EMPLOYEE") as UserRole;

  if (!first_name || !last_name || !email) {
    return { error: "Nombre, apellido y correo son obligatorios." };
  }

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (createError || !created.user) {
    return { error: createError?.message ?? "No se pudo crear el usuario." };
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    first_name,
    last_name,
    email,
    role,
    status: "ACTIVE",
    department,
    position,
    employee_code,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: profileError.message };
  }

  revalidatePath("/admin/empleados");
  return { tempPassword };
}

export async function updateEmployee(
  _prevState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  await assertIsAdmin();

  const id = String(formData.get("id") ?? "");
  const first_name = String(formData.get("first_name") ?? "").trim();
  const last_name = String(formData.get("last_name") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim() || null;
  const position = String(formData.get("position") ?? "").trim() || null;
  const employee_code = String(formData.get("employee_code") ?? "").trim() || null;

  if (!id || !first_name || !last_name) {
    return { error: "Nombre y apellido son obligatorios." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ first_name, last_name, department, position, employee_code })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/empleados");
  return {};
}

export async function toggleEmployeeStatus(id: string, active: boolean) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status: active ? "ACTIVE" : "INACTIVE" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/empleados");
}

export async function resetEmployeePassword(
  id: string,
): Promise<EmployeeFormState> {
  await assertIsAdmin();
  const admin = createAdminClient();
  const tempPassword = generateTempPassword();

  const { error } = await admin.auth.admin.updateUserById(id, {
    password: tempPassword,
  });

  if (error) return { error: error.message };
  return { tempPassword };
}

export async function deleteEmployee(id: string) {
  await assertIsAdmin();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/empleados");
}
