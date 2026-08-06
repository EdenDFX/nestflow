"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { requireRoles } from "@/lib/auth/guards";
import { APP_ROLES } from "@/lib/auth/types";
import { assertCapability } from "@/lib/security/authz";
import {
  checkRateLimit,
  clientKeyFromHeaders,
} from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { pgUuid } from "@/lib/validation/ids";

export type AdminActionResult = {
  ok: boolean;
  error?: string;
  code?: string;
};

function revalidateAdminPaths() {
  revalidatePath("/app/admin");
  revalidatePath("/app/people");
  revalidatePath("/app/team");
  revalidatePath("/app");
}

async function recordAuditLocal(params: {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("nestflow_record_audit", {
    p_action: params.action,
    p_entity_type: params.entityType,
    p_entity_id: params.entityId ?? null,
    p_summary: params.summary,
    p_metadata: params.metadata ?? {},
  });
  if (error) {
    console.error("audit insert failed", error);
  }
}

export async function setProfileStatusAction(input: {
  userId: string;
  status: "Active" | "Inactive";
}): Promise<AdminActionResult> {
  const profile = await requireRoles(["admin", "hr"]);
  assertCapability(profile.roles, "invite_users");
  const parsed = z
    .object({
      userId: z.string().uuid(),
      status: z.enum(["Active", "Inactive"]),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid status change." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("nestflow_set_profile_status", {
    p_user_id: parsed.data.userId,
    p_status: parsed.data.status,
  });

  if (error) {
    return { ok: false, code: "FORBIDDEN", error: error.message };
  }

  revalidateAdminPaths();
  return { ok: true };
}

export async function setUserRolesAction(input: {
  userId: string;
  roles: string[];
}): Promise<AdminActionResult> {
  const profile = await requireRoles(["admin"]);
  assertCapability(profile.roles, "manage_users");
  const parsed = z
    .object({
      userId: z.string().uuid(),
      roles: z.array(z.enum(APP_ROLES)).min(1),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Select at least one role." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("nestflow_set_user_roles", {
    p_user_id: parsed.data.userId,
    p_roles: parsed.data.roles,
  });

  if (error) {
    return { ok: false, code: "FORBIDDEN", error: error.message };
  }

  revalidateAdminPaths();
  return { ok: true };
}

export async function setProfileDepartmentAction(input: {
  userId: string;
  department: string;
}): Promise<AdminActionResult> {
  await requireRoles(["admin"]);
  const parsed = z
    .object({
      userId: z.string().uuid(),
      department: z.string().trim().max(120),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid department." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("nestflow_set_profile_department", {
    p_user_id: parsed.data.userId,
    p_department: parsed.data.department,
  });

  if (error) {
    return { ok: false, code: "FORBIDDEN", error: error.message };
  }

  revalidateAdminPaths();
  return { ok: true };
}

export async function createDepartmentAction(input: {
  name: string;
  description?: string;
}): Promise<AdminActionResult> {
  const profile = await requireRoles(["admin"]);
  assertCapability(profile.roles, "manage_departments");
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(80),
      description: z.string().trim().max(500).optional().default(""),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid department." };
  }

  const slug = parsed.data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_departments")
    .insert({
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordAuditLocal({
    action: "department_created",
    entityType: "department",
    entityId: data.id,
    summary: `Created department ${parsed.data.name}`,
    metadata: { actorId: profile.userId },
  });

  revalidateAdminPaths();
  return { ok: true };
}

export async function deleteDepartmentAction(
  departmentId: string,
): Promise<AdminActionResult> {
  await requireRoles(["admin"]);
  const parsed = z.string().uuid().safeParse(departmentId);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid department." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("nf_departments")
    .delete()
    .eq("id", parsed.data);

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordAuditLocal({
    action: "department_deleted",
    entityType: "department",
    entityId: parsed.data,
    summary: "Deleted department",
  });

  revalidateAdminPaths();
  return { ok: true };
}

export async function createInviteAction(input: {
  email: string;
  nestId?: string;
  fullName?: string;
  department?: string;
  roles?: string[];
  note?: string;
}): Promise<AdminActionResult> {
  const profile = await requireRoles(["admin", "hr"]);
  assertCapability(profile.roles, "invite_users");

  const headerStore = await headers();
  const rate = checkRateLimit({
    key: clientKeyFromHeaders(headerStore, `invite:${profile.userId}`),
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!rate.ok) {
    return {
      ok: false,
      code: "RATE_LIMITED",
      error: `Invite rate limit reached. Try again in ${rate.retryAfterSeconds}s.`,
    };
  }
  const parsed = z
    .object({
      email: z.string().trim().email(),
      nestId: z.string().trim().max(40).optional(),
      fullName: z.string().trim().max(120).optional(),
      department: z.string().trim().max(120).optional(),
      roles: z.array(z.enum(APP_ROLES)).min(1).default(["staff"]),
      note: z.string().trim().max(500).optional().default(""),
    })
    .safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: parsed.error.issues[0]?.message ?? "Invalid invite.",
    };
  }

  // HR may only invite staff role
  const roles = profile.roles.includes("admin")
    ? parsed.data.roles
    : (["staff"] as const);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("nf_invites")
    .insert({
      email: parsed.data.email.toLowerCase(),
      nest_id: parsed.data.nestId || null,
      full_name: parsed.data.fullName || null,
      department: parsed.data.department || null,
      roles,
      note: parsed.data.note,
      invited_by: profile.userId,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  const admin = createAdminClient();
  if (admin) {
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      parsed.data.email,
      {
        data: {
          nest_id: parsed.data.nestId ?? null,
          full_name: parsed.data.fullName ?? null,
          department: parsed.data.department ?? null,
        },
      },
    );
    if (inviteError) {
      console.error("Supabase invite email failed", inviteError);
    }
  }

  await recordAuditLocal({
    action: "invite_created",
    entityType: "invite",
    entityId: data.id,
    summary: `Invited ${parsed.data.email}`,
    metadata: { roles },
  });

  revalidateAdminPaths();
  return { ok: true };
}

export async function revokeInviteAction(
  inviteId: string,
): Promise<AdminActionResult> {
  await requireRoles(["admin", "hr"]);
  const parsed = z.string().uuid().safeParse(inviteId);
  if (!parsed.success) {
    return { ok: false, code: "VALIDATION_ERROR", error: "Invalid invite." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("nf_invites")
    .update({ status: "revoked" })
    .eq("id", parsed.data)
    .eq("status", "pending");

  if (error) {
    return { ok: false, code: "INTERNAL", error: error.message };
  }

  await recordAuditLocal({
    action: "invite_revoked",
    entityType: "invite",
    entityId: parsed.data,
    summary: "Revoked invite",
  });

  revalidateAdminPaths();
  return { ok: true };
}

export async function setTeamMembershipAction(input: {
  teamId: string;
  userId: string;
  isManager?: boolean;
  remove?: boolean;
}): Promise<AdminActionResult> {
  const profile = await requireRoles(["admin", "hr"]);
  assertCapability(profile.roles, "invite_users");

  const parsed = z
    .object({
      // Seed teams use placeholder hex ids that fail RFC UUID but are valid Postgres uuid.
      teamId: pgUuid,
      userId: pgUuid,
      isManager: z.boolean().optional().default(false),
      remove: z.boolean().optional().default(false),
    })
    .safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      error: "Invalid team assignment.",
    };
  }

  const supabase = await createClient();

  if (parsed.data.remove) {
    const { error } = await supabase
      .from("nf_team_memberships")
      .delete()
      .eq("team_id", parsed.data.teamId)
      .eq("user_id", parsed.data.userId);

    if (error) {
      return { ok: false, code: "FORBIDDEN", error: error.message };
    }

    await recordAuditLocal({
      action: "team_member_removed",
      entityType: "team",
      entityId: parsed.data.teamId,
      summary: `Removed member from team`,
      metadata: { userId: parsed.data.userId },
    });

    revalidateAdminPaths();
    return { ok: true };
  }

  const { error } = await supabase.from("nf_team_memberships").upsert(
    {
      team_id: parsed.data.teamId,
      user_id: parsed.data.userId,
      is_manager: parsed.data.isManager,
    },
    { onConflict: "team_id,user_id" },
  );

  if (error) {
    return { ok: false, code: "FORBIDDEN", error: error.message };
  }

  // Functional team assignment replaces General. People should not keep dual General membership.
  const { data: targetTeam } = await supabase
    .from("nf_teams")
    .select("id, slug, name")
    .eq("id", parsed.data.teamId)
    .maybeSingle();

  const targetIsGeneral =
    targetTeam?.slug === "general" ||
    targetTeam?.name?.toLowerCase() === "general";

  if (targetTeam && !targetIsGeneral) {
    const { data: generalTeams } = await supabase
      .from("nf_teams")
      .select("id")
      .or("slug.eq.general,name.eq.General");

    for (const general of generalTeams ?? []) {
      if (general.id === parsed.data.teamId) continue;
      const { error: leaveGeneralError } = await supabase
        .from("nf_team_memberships")
        .delete()
        .eq("team_id", general.id)
        .eq("user_id", parsed.data.userId);

      if (leaveGeneralError) {
        console.error("leave general after team assign failed", leaveGeneralError);
      }
    }
  }

  await recordAuditLocal({
    action: "team_member_assigned",
    entityType: "team",
    entityId: parsed.data.teamId,
    summary: parsed.data.isManager
      ? "Assigned line manager to team"
      : "Assigned team member",
    metadata: {
      userId: parsed.data.userId,
      isManager: parsed.data.isManager,
      leftGeneral: Boolean(targetTeam && !targetIsGeneral),
    },
  });

  revalidateAdminPaths();
  return { ok: true };
}
