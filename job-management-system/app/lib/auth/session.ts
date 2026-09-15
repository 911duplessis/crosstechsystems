import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/auth/roles";

export interface CurrentProfile {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
}

/** Reads the authenticated user's profile. Returns null when signed out. */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_active")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    role: profile.role as Role,
    isActive: profile.is_active,
  };
}
