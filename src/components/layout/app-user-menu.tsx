"use client";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/auth/actions";
import { profileInitials } from "@/lib/auth/profile-initials";
import { primaryRole, roleLabel, type NestFlowProfile } from "@/lib/auth/types";

export function AppUserMenu({ profile }: { profile: NestFlowProfile }) {
  const displayRole = roleLabel(primaryRole(profile.roles));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 gap-2 rounded-full px-1.5 sm:px-2"
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
