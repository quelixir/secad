"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AboutDialog } from "@/components/ui/about-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Menu,
  BriefcaseBusiness,
  Building2,
  LayoutDashboard,
  Layers,
  Network,
  ScrollText,
  Database,
  BookUser,
  ArrowRightLeft,
  LogOut,
  User,
  ArrowLeftRight,
  Settings,
  Palette,
  Moon,
  Sun,
  SunMoon,
  FileSearch,
  Info,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth-context";
import { useEntityContext } from "@/lib/entity-context";

const navigation = [
  {
    name: "Entities",
    href: "/entities",
    icon: Building2,
    description: "Manage secad entities",
  },
  {
    name: "Associates",
    href: "/associates",
    icon: Network,
    description: "Manage entity associates",
  },
  {
    name: "Resolutions",
    href: "/resolutions",
    icon: ScrollText,
    description: "Resolutions for the current entity",
  },
  {
    name: "Registry",
    href: "/registry",
    icon: Database,
    description: "Entity registry view",
    subNav: [
      { name: "Dashboard", href: "/registry", icon: LayoutDashboard },
      { name: "Securities", href: "/registry/securities", icon: Layers },
      { name: "Members", href: "/registry/members", icon: BookUser },
      {
        name: "Transactions",
        href: "/registry/transactions",
        icon: ArrowRightLeft,
      },
    ],
  },
  {
    name: "Documents",
    href: "/documents",
    icon: FolderOpen,
    description: "Manage entity documents and files",
  },
  {
    name: "Audit",
    href: "/audit",
    icon: FileSearch,
    description: "View system events and audit logs",
  },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const { selectedEntity, clearSelectedEntity } = useEntityContext();
  const { theme, setTheme } = useTheme();

  const NavItems = () => (
    <>
      {navigation.map((item) => {
        // Only show Entities if no entity is selected, show all if entity is selected
        if (!selectedEntity && item.name !== "Entities") {
          return null;
        }

        const isActive =
          pathname &&
          (pathname === item.href ||
            (item.href.startsWith("/registry") &&
              pathname.startsWith("/registry")) ||
            (item.href === "/entities" && pathname.startsWith("/entities")) ||
            (item.href === "/documents" && pathname.startsWith("/documents")) ||
            (item.href === "/audit" && pathname.startsWith("/audit")));
        const Icon = item.icon;

        return (
          <div
            key={item.name}
            onMouseEnter={() => setHoveredItem(item.name)}
            onMouseLeave={() => setHoveredItem(null)}
            className="relative"
          >
            <Link
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          </div>
        );
      })}
    </>
  );

  const handleChangeEntity = () => {
    clearSelectedEntity();
    router.push("/entities");
  };

  const handleThemeChange = (value: string) => {
    if (value) {
      setTheme(value);
    }
  };

  return (
    <>
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-6">
            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
              <BriefcaseBusiness className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">
              sec<span className="italic">ad</span>
            </span>
            {/* <Badge variant="secondary" className="text-xs">
              Beta
            </Badge> */}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 flex-1">
            <NavItems />
          </div>

          {/* Entity Indicator and User - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            {selectedEntity && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleChangeEntity}
                className="text-xs"
              >
                {selectedEntity.name}
                <ArrowLeftRight className="h-3 w-3 ml-1" />
              </Button>
            )}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">My Account</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="flex flex-col items-start">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/*
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  */}
                  <DropdownMenuItem>
                    <Palette className="mr-2 h-4 w-4" />
                    <span>Theme</span>
                    <div className="ml-auto">
                      <ToggleGroup
                        type="single"
                        value={theme}
                        onValueChange={handleThemeChange}
                        size="sm"
                      >
                        <ToggleGroupItem
                          value="light"
                          aria-label="Light theme"
                          className="data-[state=on]:bg-zinc-700 data-[state=on]:text-white"
                        >
                          <Sun className="h-3 w-3 data-[state=on]:text-white" />
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="dark"
                          aria-label="Dark theme"
                          className="data-[state=on]:bg-zinc-700 data-[state=on]:text-white"
                        >
                          <Moon className="h-3 w-3 data-[state=on]:text-white" />
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="system"
                          aria-label="System theme"
                          className="data-[state=on]:bg-zinc-700 data-[state=on]:text-white"
                        >
                          <SunMoon className="h-3 w-3 data-[state=on]:text-white" />
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AboutDialog
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Info className="mr-2 h-4 w-4" />
                        <span>About</span>
                      </DropdownMenuItem>
                    }
                  />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex-1 flex justify-end">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                {/* Entity Indicator - Mobile */}
                {selectedEntity && (
                  <div className="mb-4 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleChangeEntity}
                      className="w-full justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs truncate">
                          {selectedEntity.name}
                        </span>
                      </div>
                      <ArrowLeftRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Theme Toggle - Mobile */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Theme</span>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={theme}
                    onValueChange={handleThemeChange}
                    className="w-full"
                  >
                    <ToggleGroupItem
                      value="light"
                      aria-label="Light theme"
                      className="flex-1 data-[state=on]:bg-sky-600 data-[state=on]:text-white"
                    >
                      <Sun className="h-4 w-4 mr-2 data-[state=on]:text-white" />
                      Light
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="dark"
                      aria-label="Dark theme"
                      className="flex-1 data-[state=on]:bg-sky-600 data-[state=on]:text-white"
                    >
                      <Moon className="h-4 w-4 mr-2 data-[state=on]:text-white" />
                      Dark
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="system"
                      aria-label="System theme"
                      className="flex-1 data-[state=on]:bg-sky-600 data-[state=on]:text-white"
                    >
                      <SunMoon className="h-4 w-4 mr-2 data-[state=on]:text-white" />
                      System
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>

                {/* User Info - Mobile */}
                {user && (
                  <div className="mb-4 flex items-center justify-center gap-2 text-sm border-b pb-4">
                    <User className="h-4 w-4" />
                    <span>{user.name || user.username || user.email}</span>
                    <Button variant="ghost" size="icon" onClick={signOut}>
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* About - Mobile */}
                <div className="mb-4 border-b pb-4">
                  <AboutDialog />
                </div>

                <div className="flex flex-col gap-2">
                  <NavItems />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Sub-navbar for Registry */}
      {selectedEntity && (
        <div
          className={cn(
            "border-b bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/30 overflow-hidden transition-all duration-300 ease-in-out",
            hoveredItem === "Registry" ||
              (pathname && pathname.startsWith("/registry"))
              ? "h-12 opacity-100 translate-y-0"
              : "h-0 opacity-0 -translate-y-2",
          )}
          onMouseEnter={() => setHoveredItem("Registry")}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <div className="flex h-12 items-center px-4">
            <div className="hidden md:flex items-center space-x-1 ml-[calc(theme(spacing.16)+theme(spacing.6))]">
              {navigation
                .find((item) => item.name === "Registry")
                ?.subNav?.map((subItem) => {
                  const isActive =
                    pathname &&
                    (pathname === subItem.href ||
                      (subItem.name === "Transactions" &&
                        pathname.startsWith("/registry/transactions")) ||
                      (subItem.name === "Members" &&
                        pathname.startsWith("/registry/members")) ||
                      (subItem.name === "Securities" &&
                        pathname.startsWith("/registry/securities")));
                  const SubIcon = subItem.icon;

                  return (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted",
                      )}
                    >
                      <SubIcon className="h-4 w-4" />
                      {subItem.name}
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
