'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, BriefcaseBusiness, Building2, LayoutDashboard, Layers, Network, ScrollText, Database, BookUser, ArrowRightLeft, LogOut, User } from 'lucide-react'
import { cn } from '@/lib/utils'

import EntitySelector from './entity-selector'
import { ThemeToggle } from '@/components/theme-toggle'
import { useAuth } from '@/lib/auth-context'

const navigation = [
  {
    name: 'Entities',
    href: '/entities',
    icon: Building2,
    description: 'Manage secad entities'
  },
  {
    name: 'Associates',
    href: '/associates',
    icon: Network,
    description: 'Manage entity associates'
  },
  {
    name: 'Resolutions',
    href: '/resolutions',
    icon: ScrollText,
    description: 'Resolutions for the current entity'
  },
  {
    name: 'Registry',
    href: '/registry',
    icon: Database,
    description: 'Entity registry view',
    subNav: [
      { name: 'Dashboard', href: '/registry', icon: LayoutDashboard },
      { name: 'Securities', href: '/registry/securities', icon: Layers },
      { name: 'Members', href: '/registry/members', icon: BookUser },
      { name: 'Transactions', href: '/registry/transactions', icon: ArrowRightLeft }
    ]
  }
]

export function Navbar() {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const { user, signOut } = useAuth()

  const NavItems = () => (
    <>
      {navigation.map((item) => {
        const isActive = pathname === item.href ||
          (item.href.startsWith('/registry') && pathname.startsWith('/registry'))
        const Icon = item.icon

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
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          </div>
        )
      })}
    </>
  )

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

          {/* Entity Selector - Desktop */}
          <div className="hidden md:flex items-center gap-2">
            <EntitySelector />
            <ThemeToggle />
            {user && (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.name || user.username || user.email}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
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
                {/* Entity Selector - Mobile */}
                <div className="mb-4 mt-4">
                  <EntitySelector />
                </div>

                {/* Theme Toggle - Mobile */}
                <div className="mb-4 flex justify-center">
                  <ThemeToggle />
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

                <div className="flex flex-col gap-2">
                  <NavItems />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Sub-navbar for Registry */}
      <div
        className={cn(
          "border-b bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/30 overflow-hidden transition-all duration-300 ease-in-out",
          (hoveredItem === 'Registry' || pathname.startsWith('/registry'))
            ? 'h-12 opacity-100 translate-y-0'
            : 'h-0 opacity-0 -translate-y-2'
        )}
        onMouseEnter={() => setHoveredItem('Registry')}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <div className="flex h-12 items-center px-4">
          <div className="hidden md:flex items-center space-x-1 ml-[calc(theme(spacing.16)+theme(spacing.6))]">
            {navigation.find(item => item.name === 'Registry')?.subNav?.map((subItem) => {
              const isActive = pathname === subItem.href ||
                (subItem.name === 'Transactions' && pathname.startsWith('/registry/transactions'))
              const SubIcon = subItem.icon

              return (
                <Link
                  key={subItem.name}
                  href={subItem.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <SubIcon className="h-4 w-4" />
                  {subItem.name}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
} 