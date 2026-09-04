"use client";

import Link from "next/link";
import { useSoundEnabled } from "react-sounds";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/auth/actions";
import { profileInitials } from "@/lib/auth/profile-initials";
import { primaryRole, roleLabel, type NestFlowProfile } from "@/lib/auth/types";
import { playAppSound } from "@/lib/sounds/play";

export function AppUserMenu({ profile }: { profile: NestFlowProfile }) {
  const displayRole = roleLabel(primaryRole(profile.roles));
  const [soundEnabled, setSoundEnabled] = useSoundEnabled();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label="Account menu"
          className="size-10 rounded-full p-0"
        >
          <Avatar className="size-8 ring-2 ring-border">
            {profile.avatarUrl ? (
              <AvatarImage src={profile.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {profileInitials(profile)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-1">
          <p className="truncate text-sm font-medium">
            {profile.fullName ?? "NestFlow user"}
          </p>
          <p className="truncate text-xs font-normal text-muted-foreground">
            {profile.nestId ? `Nest ID ${profile.nestId}` : profile.email}
          </p>
          <p className="text-xs font-normal text-muted-foreground">
            {displayRole}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/profile">Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/notifications">Inbox</Link>
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem
          checked={soundEnabled}
          onCheckedChange={(checked) => {
            const next = checked === true;
            if (next) {
              setSoundEnabled(true);
              playAppSound("click");
            } else {
              playAppSound("click");
              setSoundEnabled(false);
            }
          }}
          onSelect={(event) => event.preventDefault()}
        >
          Sound effects
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void signOutAction();
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
