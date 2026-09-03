import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

interface ExpenseSignatureRow {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  currency: string;
  date: string;
  status: string;
}

export interface DuplicateMatch {
  sameEmployee: boolean;
  otherEmployeeNames: string[];
  matchCount: number;
}

// Capa 1 de detección de posibles duplicados: mismo tipo + monto + moneda +
// fecha, sin IA ni comparación de fotos (esas quedan como capas futuras
// opcionales, ver conversación con el usuario). Se compara contra gastos
// Reportado y también ya Aprobado (para agarrar el caso más grave: alguien
// reporta hoy lo mismo que ya se le pagó a otro), pero nunca contra
// Rechazado — ya está resuelto. No hay estado de "revisado" que persistir:
// la resolución de la alerta ES el Aprobar/Rechazar normal que ya existe —
// en cuanto el gasto deja de estar Reportado, esta consulta deja de
// marcarlo la próxima vez que se renderiza.
export async function getDuplicateMatches(
  supabase: SupabaseClient<Database>,
): Promise<Map<string, DuplicateMatch>> {
  const { data } = await supabase
    .from("expenses")
    .select("id, user_id, type, amount, currency, date, status")
    .in("status", ["REPORTADO", "APROBADO"]);

  const rows = (data ?? []) as ExpenseSignatureRow[];
  if (rows.length === 0) return new Map();

  const groups = new Map<string, ExpenseSignatureRow[]>();
  for (const row of rows) {
    const key = `${row.type}|${row.amount}|${row.currency}|${row.date}`;
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }

  const pending = new Map<
    string,
    { sameEmployee: boolean; otherUserIds: string[]; matchCount: number }
  >();
  const userIdsToLookUp = new Set<string>();

  for (const group of groups.values()) {
    if (group.length < 2 || !group.some((r) => r.status === "REPORTADO")) continue;
    for (const row of group) {
      if (row.status !== "REPORTADO") continue;
      const others = group.filter((r) => r.id !== row.id);
      const otherUserIds = Array.from(
        new Set(others.filter((o) => o.user_id !== row.user_id).map((o) => o.user_id)),
      );
      otherUserIds.forEach((id) => userIdsToLookUp.add(id));
      pending.set(row.id, {
        sameEmployee: otherUserIds.length === 0,
        otherUserIds,
        matchCount: others.length,
      });
    }
  }

  if (pending.size === 0) return new Map();

  const nameById = new Map<string, string>();
  if (userIdsToLookUp.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", Array.from(userIdsToLookUp));
    for (const p of profiles ?? []) {
      nameById.set(p.id, `${p.first_name} ${p.last_name}`.trim());
    }
  }

  const result = new Map<string, DuplicateMatch>();
  for (const [id, info] of pending) {
    result.set(id, {
      sameEmployee: info.sameEmployee,
      otherEmployeeNames: info.otherUserIds.map((uid) => nameById.get(uid) ?? "—"),
      matchCount: info.matchCount,
    });
  }
  return result;
}
