"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  Check,
  LogOut,
  Monitor,
  Moon,
  Sparkles,
  Sun,
  BadgeCheck,
  CreditCard,
  ChevronsUpDown,
} from "lucide-react";

import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@mailtobills/ui/components/avatar";

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@mailtobills/ui/components/dropdown-menu";

import {
  useSidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@mailtobills/ui/components/sidebar";

export function NavUser({
  user,
}: {
  user: {
    name?: string;
    email: string;
    avatar: string;
  };
}) {
  const { isMobile } = useSidebar();
  const { signOut } = useAuthActions();
  const { theme, setTheme } = useTheme();
  const t = useTranslations("Navigation");

  const themeOptions = [
    { value: "light", label: t("light"), icon: Sun },
    { value: "dark", label: t("dark"), icon: Moon },
    { value: "system", label: t("system"), icon: Monitor },
  ] as const;
  const fallback = (user.name ?? user.email).slice(0, 2).toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label={t("userMenu")}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name ?? ""} />
                <AvatarFallback className="rounded-lg">
                  {fallback}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {user.name && (
                  <span className="truncate font-medium">{user.name}</span>
                )}
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name ?? ""} />
                  <AvatarFallback className="rounded-lg">
                    {fallback}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Sparkles />
                  {t("upgrade")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <BadgeCheck />
                  {t("account")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <CreditCard />
                  {t("billing")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-muted-foreground font-mono text-[10px] font-medium tracking-[0.08em] uppercase">
                {t("theme")}
              </DropdownMenuLabel>
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
                  <Icon />
                  {label}
                  {theme === value ? <Check className="ml-auto" /> : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut />
              {t("logOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
