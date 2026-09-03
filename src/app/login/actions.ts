"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/i18n/get-dictionary";

export interface LoginState {
  error?: string;
}

export async function signIn(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const dict = await getDictionary();
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: dict.auth.errors.missingCredentials };
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
      return { error: dict.auth.errors.invalidCredentials };
    }
    email = profile.email;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: dict.auth.errors.invalidCredentials };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, role")
    .eq("id", data.user.id)
    .single();

  if (profile?.status === "INACTIVE") {
    await supabase.auth.signOut();
    return { error: dict.auth.errors.inactiveUser };
  }

  redirect(profile?.role === "ADMIN" ? "/admin" : "/empleado");
}
