import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Cliente con service role: bypassa RLS. Solo se debe importar desde
 * Server Actions o Route Handlers ya protegidos por rol ADMIN — nunca
 * exponer al cliente ni al bundle del navegador (el import de
 * "server-only" hace fallar el build si eso ocurre).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
