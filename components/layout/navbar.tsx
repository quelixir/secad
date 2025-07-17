'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu, X, Home, Building2, GitBranch, Users, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { EntitySelector } from './entity-selector'

const navigation = [
  {
    name: 'Entities',
    href: '/entities',
    icon: Building2,
    description: 'Manage corporate entities'
  },
  {
    name: 'Associates',
    href: '/associates',
    icon: Users,
    description: 'Manage directors and secretaries'
  },
  {
    name: 'Resolutions',
    href: '/resolutions',
    icon: FileText,
    description: 'Directors and members resolutions'
  },
  {
    name: 'Registry',
    href: '/registry',
    icon: GitBranch,
    description: 'Entity registry view'
  }
]

export function Navbar() {
  const pathname = usePathname()

  const NavItems = () => (
    <>
      {navigation.map((item) => {
        const isActive = pathname === item.href || 
          (item.href === '/registry' && (
            pathname.startsWith('/members') || 
            pathname.startsWith('/securities') || 
            pathname.startsWith('/transactions')
          ))
        const Icon = item.icon
        
        return (
          <Link
            key={item.name}
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
        )
      })}
    </>
  )

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg">
            SECAD
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
        <div className="hidden md:flex items-center">
          <EntitySelector />
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
              
              <div className="flex flex-col gap-2">
                <NavItems />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
} 