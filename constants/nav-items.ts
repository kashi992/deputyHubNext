import {
  BellIcon,
  CodeIcon,
  CreditCardIcon,
  HomeIcon,
  LockKeyholeIcon,
  SettingsIcon,
  StoreIcon,
  UserIcon,
  UserPlus2Icon,
  UsersIcon,
  PlugIcon
} from 'lucide-react';

import { Routes } from '@/constants/routes';
import type { NavItem } from '@/types/nav-item';

export const mainNavItems: NavItem[] = [
  {
    title: 'Home',
    href: Routes.Home,
    icon: HomeIcon
  },
  {
    title: 'Contacts',
    href: Routes.Contacts,
    icon: UsersIcon
  },
  {
    title: 'Settings',
    href: Routes.Settings,
    icon: SettingsIcon
  }
];

export const accountNavItems: NavItem[] = [
  {
    title: 'Profile',
    href: Routes.Profile,
    icon: UserIcon
  },
  {
    title: 'Security',
    href: Routes.Security,
    icon: LockKeyholeIcon
  },
  {
    title: 'Notifications',
    href: Routes.Notifications,
    icon: BellIcon
  }
];

export const organisationNavItems: NavItem[] = [
  {
    title: 'Information',
    href: Routes.OrganisationInformation,
    icon: StoreIcon
  },
  {
    title: 'Members',
    href: Routes.Members,
    icon: UserPlus2Icon
  },
  {
    title: 'Developers',
    href: Routes.Developers,
    icon: CodeIcon
  }
];
