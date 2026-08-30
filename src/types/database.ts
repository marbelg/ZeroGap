export type UserRole = "ADMIN" | "EMPLOYEE" | "EMPLEADO_INDIRECTO" | "CAJA_CHICA" | "HOTEL";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type ExpenseType =
  | "DESAYUNO"
  | "ALMUERZO"
  | "CENA"
  | "KILOMETRAJE"
  | "REPARACION_LLANTAS"
  | "CAJA_CHICA"
  | "HOSPEDAJE";
export type ExpenseStatus = "REPORTADO" | "APROBADO" | "RECHAZADO";
export type Currency = "USD" | "CRC";
export type PhotoType = "COMPROBANTE" | "ODOMETRO_INICIAL" | "ODOMETRO_FINAL";

// Nota: se declaran como `type` (no `interface`) a propósito — TypeScript solo
// infiere un índice implícito para type literals, no para interfaces, y sin
// eso no satisfacen la restricción `Row extends Record<string, unknown>` que
// exige postgrest-js, lo que colapsaba toda la inferencia de `.from(...)` a
// `never`.
export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  cedula: string | null;
  bank_account: string | null;
  department: string | null;
  position: string | null;
  employee_code: string | null;
  nightly_rate: number | null;
  created_at: string;
}

export type Expense = {
  id: string;
  user_id: string;
  type: ExpenseType;
  date: string;
  time: string;
  amount: number;
  currency: Currency;
  description: string | null;
  nights: number | null;
  status: ExpenseStatus;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type Mileage = {
  id: string;
  expense_id: string;
  start_location: string;
  end_location: string;
  start_time: string;
  end_time: string;
  initial_odometer: number;
  final_odometer: number;
  kilometers: number;
}

export type ExpensePhoto = {
  id: string;
  expense_id: string;
  photo_type: PhotoType;
  file_url: string;
  created_at: string;
}

export type AppSettings = {
  id: boolean;
  weekly_budget_total: number;
  weekly_budget_desayuno: number;
  weekly_budget_almuerzo: number;
  weekly_budget_cena: number;
  km_rate: number;
  payment_day_of_week: number;
  monthly_budget_caja_chica: number;
  monthly_budget_no_directo: number;
  updated_at: string;
}

// Tipado mínimo compatible con el genérico `Database` que espera
// `@supabase/ssr` / `@supabase/supabase-js`. Se puede reemplazar por el
// tipo generado con `supabase gen types typescript` una vez exista el
// proyecto Supabase conectado, sin cambiar el resto del código.
// Las tablas deben declarar `Row`/`Insert`/`Update`/`Relationships` y el
// esquema `Views`/`Functions`/`Enums`/`CompositeTypes` (aunque vacíos) para
// que la inferencia de tipos de supabase-js no colapse a `never`.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id" | "first_name" | "last_name" | "email">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      expenses: {
        Row: Expense;
        Insert: Partial<Expense> & Pick<Expense, "user_id" | "type" | "date" | "time" | "amount" | "currency">;
        Update: Partial<Expense>;
        Relationships: [];
      };
      mileage: {
        Row: Mileage;
        Insert: Partial<Mileage> & Pick<Mileage, "expense_id" | "start_location" | "end_location" | "start_time" | "end_time" | "initial_odometer" | "final_odometer">;
        Update: Partial<Mileage>;
        Relationships: [];
      };
      expense_photos: {
        Row: ExpensePhoto;
        Insert: Partial<ExpensePhoto> & Pick<ExpensePhoto, "expense_id" | "photo_type" | "file_url">;
        Update: Partial<ExpensePhoto>;
        Relationships: [];
      };
      app_settings: {
        Row: AppSettings;
        Insert: Partial<AppSettings>;
        Update: Partial<AppSettings>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
