"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { AdminTeamAssignDrawer } from "@/components/admin/admin-team-assign-drawer";
import { GripVerticalIcon } from "@/components/icons/grip-vertical";
import { UserIcon } from "@/components/icons/user";
import { UsersIcon } from "@/components/icons/users";

import { Button } from "@/components/ui/button";
import { setTeamMembershipAction } from "@/lib/admin/actions";
import type {
  DirectoryUser,
  NestFlowTeam,
  TeamMembershipRow,
} from "@/lib/admin/types";
import { cn } from "@/lib/utils";

type DragPerson = {
  userId: string;
  fullName: string | null;
  nestId: string | null;
  email: string | null;
  sourceTeamId: string | null;
  isManager: boolean;
};

function personLabel(person: {
  fullName: string | null;
  nestId: string | null;
  email: string | null;
  userId: string;
}) {
  return person.fullName ?? person.email ?? person.nestId ?? person.userId;
}

function isGeneralTeam(team: NestFlowTeam) {
  return team.slug === "general" || team.name.toLowerCase() === "general";
}

function parseDroppableId(id: string): { kind: "team" | "manager"; teamId: string } | null {
  if (id.startsWith("team:")) {
    return { kind: "team", teamId: id.slice("team:".length) };
  }
  if (id.startsWith("manager:")) {
    // manager:{teamId}:{managerUserId}
    const rest = id.slice("manager:".length);
    const split = rest.indexOf(":");
    if (split === -1) return null;
    return { kind: "manager", teamId: rest.slice(0, split) };
  }
  return null;
}

function parseDraggableId(id: string): {
  userId: string;
  sourceTeamId: string | null;
} | null {
  if (id.startsWith("pool:")) {
    return { userId: id.slice("pool:".length), sourceTeamId: null };
  }
  if (id.startsWith("member:")) {
    // member:{teamId}:{userId}
    const rest = id.slice("member:".length);
    const split = rest.indexOf(":");
    if (split === -1) return null;
    return {
      sourceTeamId: rest.slice(0, split),
      userId: rest.slice(split + 1),
    };
  }
  return null;
}

function resolveDropTarget(
  overId: string,
): { kind: "team" | "manager"; teamId: string } | null {
  const direct = parseDroppableId(overId);
  if (direct) return direct;
  // Dropping onto another person card still counts as that team's roster.
  const asMember = parseDraggableId(overId);
  if (asMember?.sourceTeamId) {
    return { kind: "team", teamId: asMember.sourceTeamId };
  }
  return null;
}

function DraggablePersonCard({
  id,
  person,
  badge,
  disabled,
}: {
  id: string;
  person: {
    userId: string;
    fullName: string | null;
    nestId: string | null;
    email: string | null;
  };
  badge?: string | null;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id, disabled });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border/70 bg-background px-2.5 py-2",
        isDragging && "opacity-40",
        disabled ? "opacity-60" : "cursor-grab active:cursor-grabbing",
      )}
    >
      <button
        type="button"
        className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:pointer-events-none"
        aria-label={`Drag ${personLabel(person)}`}
        disabled={disabled}
        {...listeners}
        {...attributes}
      >
        <GripVerticalIcon className="inline-flex" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{personLabel(person)}</p>
          {badge ? (
            <span className="shrink-0 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-semibold text-background">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          {person.nestId ?? person.email}
        </p>
      </div>
    </div>
  );
}

function PersonOverlayCard({ person }: { person: DragPerson }) {
  return (
    <div className="flex w-60 items-center gap-2 rounded-lg border border-primary/40 bg-card px-2.5 py-2 shadow-lg ring-1 ring-primary/20">
      <GripVerticalIcon className="inline-flex shrink-0 text-primary" aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{personLabel(person)}</p>
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          {person.nestId ?? person.email}
        </p>
      </div>
    </div>
  );
}

function TeamDropZone({
  team,
  roster,
  pending,
  onRemove,
}: {
  team: NestFlowTeam;
  roster: TeamMembershipRow[];
  pending: boolean;
  onRemove: (teamId: string, userId: string) => void;
}) {
  const managers = roster.filter((row) => row.isManager);
  const members = roster.filter((row) => !row.isManager);

  const { setNodeRef, isOver } = useDroppable({ id: `team:${team.id}` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[220px] flex-col rounded-2xl border bg-card transition-colors",
        isOver
          ? "border-primary bg-primary/[0.04] ring-1 ring-primary/30"
          : "border-border/80",
      )}
    >
      <div className="border-b border-border/80 px-4 py-3">
        <div className="flex items-center gap-2">
          <UsersIcon className="inline-flex text-muted-foreground" aria-hidden />
          <h3 className="font-heading text-base font-semibold">{team.name}</h3>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {roster.length} member{roster.length === 1 ? "" : "s"}
          {managers.length > 0
            ? ` · ${managers.length} line manager${managers.length === 1 ? "" : "s"}`
            : " · no line manager yet"}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Line managers
          </p>
          {managers.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/80 px-3 py-3 text-xs text-muted-foreground">
              No line manager. Use “Set as line manager” below, then drop people
              here.
            </p>
          ) : (
            <ul className="space-y-2">
              {managers.map((manager) => (
                <ManagerDropTarget
                  key={manager.id}
                  teamId={team.id}
                  manager={manager}
                  pending={pending}
                  onRemove={onRemove}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Team members
          </p>
          {members.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-center text-xs text-muted-foreground">
              Drop people onto this team or a line manager.
            </p>
          ) : (
            <ul className="space-y-2">
              {members.map((row) => (
                <li key={row.id} className="flex items-stretch gap-1">
                  <div className="min-w-0 flex-1">
                    <DraggablePersonCard
                      id={`member:${row.teamId}:${row.userId}`}
                      person={row}
                      disabled={pending}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="self-center"
                    disabled={pending}
                    onClick={() => onRemove(row.teamId, row.userId)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ManagerDropTarget({
  teamId,
  manager,
  pending,
  onRemove,
}: {
  teamId: string;
  manager: TeamMembershipRow;
  pending: boolean;
  onRemove: (teamId: string, userId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `manager:${teamId}:${manager.userId}`,
  });

  return (
    <li
      ref={setNodeRef}
      className={cn(
        "rounded-xl border p-1 transition-colors",
        isOver
          ? "border-primary bg-primary/10 ring-1 ring-primary/25"
          : "border-primary/25 bg-primary/[0.03]",
      )}
    >
      <div className="flex items-stretch gap-1">
        <div className="min-w-0 flex-1">
          <DraggablePersonCard
            id={`member:${manager.teamId}:${manager.userId}`}
            person={manager}
            badge="LM"
            disabled={pending}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="self-center"
          disabled={pending}
          onClick={() => onRemove(manager.teamId, manager.userId)}
        >
          Remove
        </Button>
      </div>
      {isOver ? (
        <p className="px-2 pb-1.5 text-[11px] font-medium text-primary">
          Drop to place under {personLabel(manager)}
        </p>
      ) : (
        <p className="px-2 pb-1.5 text-[11px] text-muted-foreground">
          Drop people here to assign under this line manager
        </p>
      )}
    </li>
  );
}

export function TeamRosterPanel({
  teams,
  memberships,
  users,
}: {
  teams: NestFlowTeam[];
  memberships: TeamMembershipRow[];
  users: DirectoryUser[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activePerson, setActivePerson] = useState<DragPerson | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const rosterByTeam = useMemo(() => {
    const map = new Map<string, TeamMembershipRow[]>();
    for (const team of teams) map.set(team.id, []);
    for (const row of memberships) {
      const list = map.get(row.teamId) ?? [];
      list.push(row);
      map.set(row.teamId, list);
    }
    return map;
  }, [teams, memberships]);

  const functionalTeamIds = useMemo(() => {
    return new Set(teams.filter((team) => !isGeneralTeam(team)).map((t) => t.id));
  }, [teams]);

  /** People not yet on Creative / CRM / Project (General alone does not count). */
  const unassigned = useMemo(() => {
    const onFunctional = new Set(
      memberships
        .filter((row) => functionalTeamIds.has(row.teamId))
        .map((row) => row.userId),
    );
    return users.filter(
      (user) => user.isActive && !onFunctional.has(user.userId),
    );
  }, [users, memberships, functionalTeamIds]);

  function resolvePerson(userIdValue: string, sourceTeamId: string | null): DragPerson | null {
    if (sourceTeamId) {
      const row = memberships.find(
        (m) => m.userId === userIdValue && m.teamId === sourceTeamId,
      );
      if (row) {
        return {
          userId: row.userId,
          fullName: row.fullName,
          nestId: row.nestId,
          email: row.email,
          sourceTeamId,
          isManager: row.isManager,
        };
      }
    }
    const user = users.find((u) => u.userId === userIdValue);
    if (!user) return null;
    return {
      userId: user.userId,
      fullName: user.fullName,
      nestId: user.nestId,
      email: user.email,
      sourceTeamId,
      isManager: false,
    };
  }

  function removeMember(targetTeamId: string, targetUserId: string) {
    startTransition(async () => {
      const result = await setTeamMembershipAction({
        teamId: targetTeamId,
        userId: targetUserId,
        remove: true,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not remove member.");
        return;
      }
      toast.success("Removed from team.");
      router.refresh();
    });
  }

  function onDragStart(event: DragStartEvent) {
    const parsed = parseDraggableId(String(event.active.id));
    if (!parsed) return;
    setActivePerson(resolvePerson(parsed.userId, parsed.sourceTeamId));
  }

  function onDragEnd(event: DragEndEvent) {
    setActivePerson(null);
    const { active, over } = event;
    if (!over || pending) return;

    const drag = parseDraggableId(String(active.id));
    const drop = resolveDropTarget(String(over.id));
    if (!drag || !drop) return;

    const targetTeamId = drop.teamId;
    const alreadyOnTeam = memberships.some(
      (row) => row.teamId === targetTeamId && row.userId === drag.userId,
    );

    if (alreadyOnTeam && drag.sourceTeamId === targetTeamId) {
      toast.message("Already on this team.");
      return;
    }

    // If already on target from another drag path (e.g. pool while multi-home), skip work.
    if (alreadyOnTeam && !drag.sourceTeamId) {
      toast.message("Already on this team.");
      return;
    }

    startTransition(async () => {
      const assign = await setTeamMembershipAction({
        teamId: targetTeamId,
        userId: drag.userId,
        isManager: false,
      });
      if (!assign.ok) {
        toast.error(assign.error ?? "Could not assign member.");
        return;
      }

      // Leaving General is handled server-side when joining a functional team.
      // Also leave the source roster when moving between non-General teams.
      const sourceTeam = teams.find((team) => team.id === drag.sourceTeamId);
      const shouldLeaveSource =
        Boolean(drag.sourceTeamId) &&
        drag.sourceTeamId !== targetTeamId &&
        sourceTeam != null;

      if (shouldLeaveSource && drag.sourceTeamId) {
        const removed = await setTeamMembershipAction({
          teamId: drag.sourceTeamId,
          userId: drag.userId,
          remove: true,
        });
        if (!removed.ok) {
          toast.error(
            removed.error ??
              "Added to the new team, but could not remove from the previous one.",
          );
          router.refresh();
          return;
        }
        toast.success("Moved to team (removed from previous roster).");
      } else {
        toast.success(
          drop.kind === "manager"
            ? "Assigned under line manager (left General)."
            : "Member added to team (left General).",
        );
      }

      router.refresh();
    });
  }

  function onDragCancel() {
    setActivePerson(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-border/80 p-4">
        <div>
          <h2 className="font-heading text-base font-semibold">Teams</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign people to line-manager teams. Use the form first; open
            Advanced roster only when you need drag-and-drop.
          </p>
        </div>
        <AdminTeamAssignDrawer teams={teams} users={users} />
      </div>

      <details className="rounded-2xl border border-border/80 p-4">
        <summary className="cursor-pointer font-heading text-sm font-semibold">
          Advanced roster
        </summary>
        <p className="mt-2 text-sm text-muted-foreground">
          Drag people onto a team or line manager. Assigning to a line-manager
          team removes them from General.
        </p>
        <div className="mt-4">
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={onDragCancel}
      >
        <div className="grid gap-4 xl:grid-cols-[minmax(220px,280px)_1fr]">
          <section className="rounded-2xl border border-border/80 bg-muted/20 p-3">
            <div className="mb-3 flex items-center gap-2 px-1">
              <UserIcon className="inline-flex text-muted-foreground" aria-hidden />
              <div>
                <h3 className="font-heading text-sm font-semibold">
                  Ready to assign
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Not yet on a line-manager team
                </p>
              </div>
            </div>
            {unassigned.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                Everyone active is already under a line-manager team. Drag
                between team cards to reassign.
              </p>
            ) : (
              <ul className="max-h-[min(60vh,520px)] space-y-2 overflow-y-auto pr-1">
                {unassigned.map((user) => (
                  <DraggablePersonCard
                    key={user.userId}
                    id={`pool:${user.userId}`}
                    person={user}
                    disabled={pending}
                  />
                ))}
              </ul>
            )}
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            {teams.map((team) => (
              <TeamDropZone
                key={team.id}
                team={team}
                roster={rosterByTeam.get(team.id) ?? []}
                pending={pending}
                onRemove={removeMember}
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activePerson ? <PersonOverlayCard person={activePerson} /> : null}
        </DragOverlay>
      </DndContext>
        </div>
      </details>
    </div>
  );
}
