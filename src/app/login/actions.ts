"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error?: string;
}

export async function signIn(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Correo o contraseña incorrectos." };
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
