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
  // PIN numérico de 6 dígitos: fácil de leer y escribir en el teclado del
  // celular, pensado para empleados con poca familiaridad con contraseñas.
  const bytes = randomBytes(6);
  return Array.from(bytes, (b) => (b % 10).toString()).join("");
}

function slugify(text: string) {
  // NFD separa acentos de su letra base (ej. "é" -> "e" + acento); el
  // replace final descarta esos acentos junto con cualquier otro caracter
  // que no sea a-z0-9, sin necesidad de listar los rangos Unicode a mano.
  return text
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

async function generateUniqueEmail(
  admin: ReturnType<typeof createAdminClient>,
  firstName: string,
  lastName: string,
) {
  const base = `${slugify(firstName)}.${slugify(lastName)}`;
  let suffix = 0;
  while (true) {
    const email = `${base}${suffix ? suffix + 1 : ""}@zerogap.app`;
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (!data) return email;
    suffix++;
  }
}

async function generateUniqueEmployeeCode(
  admin: ReturnType<typeof createAdminClient>,
  role: UserRole,
) {
  // Código corto y secuencial: A### para administradores, E### para
  // empleados — pensado para escribirlo en un carnet/papel físico y
  // repartirlo, no para ser secreto. Cada rol lleva su propio contador.
  const prefix = role === "ADMIN" ? "A" : "E";

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", role);

  let n = (count ?? 0) + 1;
  while (true) {
    const code = `${prefix}${String(n).padStart(3, "0")}`;
    const { data } = await admin
      .from("profiles")
      .select("id")
      .eq("employee_code", code)
      .maybeSingle();
    if (!data) return code;
    n++;
  }
}

export interface EmployeeFormState {
  error?: string;
  tempPassword?: string;
  employeeCode?: string;
  ok?: boolean;
}

export async function createEmployee(
  _prevState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  await assertIsAdmin();

  const first_name = String(formData.get("first_name") ?? "").trim();
  const last_name = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const department = String(formData.get("department") ?? "").trim() || null;
  const position = String(formData.get("position") ?? "").trim() || null;
  const employeeCodeInput = String(formData.get("employee_code") ?? "").trim() || null;
  const role = (formData.get("role") === "ADMIN" ? "ADMIN" : "EMPLOYEE") as UserRole;

  if (!first_name || !last_name || !email) {
    return { error: "Nombre, apellido y correo son obligatorios." };
  }

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();
  const employee_code = employeeCodeInput ?? (await generateUniqueEmployeeCode(admin, role));

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
    phone,
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
  return { tempPassword, employeeCode: employee_code };
}

export interface BulkEmployeeInput {
  first_name: string;
  last_name: string;
}

export interface BulkEmployeeResult {
  first_name: string;
  last_name: string;
  employeeCode?: string;
  email?: string;
  tempPassword?: string;
  error?: string;
}

export async function createEmployeesBulk(
  people: BulkEmployeeInput[],
): Promise<BulkEmployeeResult[]> {
  await assertIsAdmin();

  const admin = createAdminClient();
  const results: BulkEmployeeResult[] = [];

  // Secuencial (no en paralelo): generateUniqueEmail/generateUniqueEmployeeCode
  // dependen de lo que ya se insertó en la vuelta anterior, para no repetir
  // correo ni código entre dos cuentas del mismo lote.
  for (const person of people) {
    const first_name = person.first_name.trim();
    const last_name = person.last_name.trim();

    if (!first_name || !last_name) {
      results.push({ first_name, last_name, error: "Falta nombre o apellido." });
      continue;
    }

    const employeeCode = await generateUniqueEmployeeCode(admin, "EMPLOYEE");
    const email = await generateUniqueEmail(admin, first_name, last_name);
    const tempPassword = generateTempPassword();

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (createError || !created.user) {
      results.push({
        first_name,
        last_name,
        error: createError?.message ?? "No se pudo crear el usuario.",
      });
      continue;
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: created.user.id,
      first_name,
      last_name,
      email,
      role: "EMPLOYEE",
      status: "ACTIVE",
      employee_code: employeeCode,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      results.push({ first_name, last_name, error: profileError.message });
      continue;
    }

    results.push({ first_name, last_name, employeeCode, email, tempPassword });
  }

  revalidatePath("/admin/empleados");
  return results;
}

export async function updateEmployee(
  _prevState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  await assertIsAdmin();

  const id = String(formData.get("id") ?? "");
  const first_name = String(formData.get("first_name") ?? "").trim();
  const last_name = String(formData.get("last_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const department = String(formData.get("department") ?? "").trim() || null;
  const position = String(formData.get("position") ?? "").trim() || null;
  const employee_code = String(formData.get("employee_code") ?? "").trim() || null;

  if (!id || !first_name || !last_name) {
    return { error: "Nombre y apellido son obligatorios." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ first_name, last_name, phone, department, position, employee_code })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/empleados");
  return { ok: true };
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
