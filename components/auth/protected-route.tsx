'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useEntityContext } from '@/lib/entity-context'

interface ProtectedRouteProps {
    children: React.ReactNode
    requireEntity?: boolean
}

// Pages that don't require an entity to be selected
const ENTITY_MANAGEMENT_PATHS = [
    '/entities',
    '/entities/new'
]

// Check if the current path is an entity management path or entity detail/edit path
const isEntityManagementPath = (pathname: string) => {
    // Check exact matches for entity management
    if (ENTITY_MANAGEMENT_PATHS.includes(pathname)) {
        return true
    }

    // Check entity detail pages (e.g., /entities/123, /entities/123/edit)
    const entityDetailPattern = /^\/entities\/[^\/]+(\/edit)?$/
    return entityDetailPattern.test(pathname)
}

export function ProtectedRoute({ children, requireEntity = true }: ProtectedRouteProps) {
    const { user, loading: authLoading } = useAuth()
    const { selectedEntity, loading: entityLoading, entityLoaded } = useEntityContext()
    const router = useRouter()
    const pathname = usePathname()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        if (!authLoading && !entityLoading && entityLoaded) {
            if (!user) {
                router.push('/auth/signin')
                return
            }

            // Check if this is an entity management path that doesn't require entity selection
            const isEntityPath = pathname ? isEntityManagementPath(pathname) : false

            if (requireEntity && !selectedEntity && !isEntityPath) {
                router.push('/entities')
                return
            }

            setIsChecking(false)
        }
    }, [user, authLoading, selectedEntity, entityLoading, entityLoaded, requireEntity, router, pathname])

    if (authLoading || entityLoading || !entityLoaded || isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    if (requireEntity && !selectedEntity && !(pathname ? isEntityManagementPath(pathname) : false)) {
        return null
    }

    return <>{children}</>
} 