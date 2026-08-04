// Hand-written to match supabase/migrations/*.sql while the project has no
// live Supabase instance to generate from yet. Once a project exists, replace
// this file with the output of:
//   npx supabase gen types typescript --project-id <id> > types/database.ts
// and keep it regenerated after every migration. Shape follows the Supabase
// CLI's generated format so the switch-over is a drop-in file replacement.

export type Role = "admin" | "manager" | "sales" | "technician" | "customer";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: Role;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          role?: Role;
          is_active?: boolean;
        };
        Update: {
          full_name?: string;
          phone?: string | null;
          role?: Role;
          is_active?: boolean;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values: Record<string, unknown> | null;
          new_values: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values?: Record<string, unknown> | null;
          new_values?: Record<string, unknown> | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role: Role;
    };
    CompositeTypes: Record<string, never>;
  };
}
