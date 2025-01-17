'use client';

import * as React from 'react';
import NiceModal from '@ebay/nice-modal-react';
import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { logOut } from '@/actions/auth/log-out';
import { CommandMenu } from '@/components/dashboard/command-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarGroupProps
} from '@/components/ui/sidebar';
import { getInitials } from '@/lib/utils';
import type { ProfileDto } from '@/types/dtos/profile-dto';

export type NavUserProps = SidebarGroupProps & {
  profile: ProfileDto;
};

export function NavUser({
  profile,
  ...other
}: NavUserProps): React.JSX.Element {
  const { theme, setTheme } = useTheme();

  const handleShowCommandMenu = (): void => {
    NiceModal.show(CommandMenu);
  };
  const handleLogOut = async (): Promise<void> => {
    const result = await logOut({ redirect: true });
    if (result?.serverError || result?.validationErrors) {
      toast.error("Couldn't log out");
    }
  };

  return (
    <SidebarGroup {...other}>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="-ml-1.5 transition-none data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:ml-0 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:!p-1">
                <Avatar className="size-7 rounded-full">
                  <AvatarImage
                    src={profile.image}
                    alt={profile.name}
                  />
                  <AvatarFallback className="rounded-full">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-medium leading-none">
                  {profile.name}
                </span>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56"
              align="start"
              forceMount
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="truncate text-sm font-medium leading-none">
                    {profile.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleShowCommandMenu}>
                  Command Menu
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex cursor-default flex-row justify-between !bg-transparent"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p>Theme</p>
                  <Select
                    value={theme}
                    onValueChange={setTheme}
                  >
                    <SelectTrigger className="h-[28px] w-[96px] px-2 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <span className="flex flex-row items-center gap-1 text-xs">
                          <SunIcon className="size-4 shrink-0 text-muted-foreground" />
                          Light
                        </span>
                      </SelectItem>
                      <SelectItem value="dark">
                        <span className="flex flex-row items-center gap-1 text-xs">
                          <MoonIcon className="size-4 shrink-0 text-muted-foreground" />
                          Dark
                        </span>
                      </SelectItem>
                      <SelectItem value="system">
                        <span className="flex flex-row items-center gap-1 text-xs">
                          <MonitorIcon className="size-4 shrink-0 text-muted-foreground" />
                          System
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogOut}>
                Log out
                <DropdownMenuShortcut>⇧⌘L</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
