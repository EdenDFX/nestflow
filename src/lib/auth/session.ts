import { redirect } from "next/navigation";

import {
  isAppRole,
  type AppRole,
  type NestFlowProfile,
} from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  user_id: string;
  nest_id: string | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  department: string | null;
  status: string | null;
  is_active: boolean;
};

export async function getSessionUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user;
}

export async function getCurrentProfile(): Promise<NestFlowProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const [{ data: profileRows, error: profileError }, { data: roleData, error: roleError }] =
    await Promise.all([
      supabase.rpc("nestflow_current_profile"),
      supabase.rpc("nestflow_current_roles"),
    ]);

  if (profileError || roleError) {
    console.error("Failed to load NestFlow profile", {
      profileError,
      roleError,
    });
    return null;
  }

  const row = Array.isArray(profileRows)
    ? (profileRows[0] as ProfileRow | undefined)
    : (profileRows as ProfileRow | null);

  if (!row) {
    return null;
  }

  const roles = (Array.isArray(roleData) ? roleData : [])
    .filter((value): value is string => typeof value === "string")
    .filter(isAppRole) as AppRole[];

  return {
    userId: row.user_id,
    nestId: row.nest_id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    department: row.department,
    status: row.status,
    isActive: Boolean(row.is_active),
    roles: roles.length > 0 ? roles : (["staff"] as AppRole[]),
  };
}

export async function requireActiveProfile(): Promise<NestFlowProfile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!profile.isActive) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login?error=inactive");
  }

  return profile;
}
