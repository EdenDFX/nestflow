"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "@/lib/sounds/toast";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerFooter,
  DrawerHeader,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setTeamMembershipAction } from "@/lib/admin/actions";
import type { DirectoryUser, NestFlowTeam } from "@/lib/admin/types";

function isGeneralTeam(team: NestFlowTeam) {
  return team.slug === "general" || team.name.toLowerCase() === "general";
}

type AdminTeamAssignDrawerProps = {
  teams: NestFlowTeam[];
  users: DirectoryUser[];
  triggerLabel?: string;
};

/** Form drawer for assigning a person to a team without drag-and-drop. */
export function AdminTeamAssignDrawer({
  teams,
  users,
  triggerLabel = "Assign to team",
}: AdminTeamAssignDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [teamId, setTeamId] = useState(teams[0]?.id ?? "");
  const [userId, setUserId] = useState(
    () => users.find((user) => user.isActive)?.userId ?? "",
  );
  const [asManager, setAsManager] = useState(false);

  function assign() {
    if (!teamId || !userId) return;
    startTransition(async () => {
      const result = await setTeamMembershipAction({
        teamId,
        userId,
        isManager: asManager,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Could not assign member.");
        return;
      }
      const target = teams.find((team) => team.id === teamId);
      const leftGeneral = target != null && !isGeneralTeam(target);
      toast.success(
        asManager
          ? leftGeneral
            ? "Line manager set (left General)."
            : "Line manager set on team."
          : leftGeneral
            ? "Member added (left General)."
            : "Member added.",
      );
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <Drawer open={open} onOpenChange={setOpen} position="right">
        <DrawerPopup showCloseButton className="flex max-h-[100dvh] w-full max-w-md flex-col">
          <DrawerHeader className="border-b border-border/70">
            <DrawerTitle>Assign to team</DrawerTitle>
          </DrawerHeader>
          <DrawerPanel className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label>Person</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((user) => user.isActive)
                    .map((user) => (
                      <SelectItem key={user.userId} value={user.userId}>
                        {user.fullName ?? user.email ?? user.userId}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Team</Label>
              <Select value={teamId} onValueChange={setTeamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={asManager}
                onChange={(event) => setAsManager(event.target.checked)}
                className="size-4 rounded border-border"
              />
              Set as line manager
            </label>
          </DrawerPanel>
          <DrawerFooter className="border-t border-border/70">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || !teamId || !userId}
              onClick={assign}
            >
              {pending ? "Saving…" : "Save assignment"}
            </Button>
          </DrawerFooter>
        </DrawerPopup>
      </Drawer>
    </>
  );
}
