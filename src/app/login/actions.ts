"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface LoginState {
  error?: string;
}

export async function signIn(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Ingresa tu usuario y contraseña." };
  }

  let email = identifier;

  if (!identifier.includes("@")) {
    // No es un correo — se asume que es un ID de empleado (ej. E001) y hay
    // que resolverlo al correo real antes de poder autenticar. Se usa el
    // cliente admin porque, sin sesión todavía, RLS no deja leer profiles
    // ajenos — esto solo expone si el ID existe (vía el mensaje de error
    // genérico de abajo, que no distingue "no existe" de "clave mala").
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("employee_code", identifier.toUpperCase())
      .maybeSingle();

    if (!profile) {
      return { error: "Usuario o contraseña incorrectos." };
    }
    email = profile.email;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, role")
    .eq("id", data.user.id)
    .single();

  if (profile?.status === "INACTIVE") {
    await supabase.auth.signOut();
    return { error: "Tu usuario está inactivo. Contacta a Administración." };
  }

  redirect(profile?.role === "ADMIN" ? "/admin" : "/empleado");
}
