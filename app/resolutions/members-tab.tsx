'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users } from 'lucide-react'

interface MembersTabProps {
  entityId: string
  entityName: string
}

export function MembersTab({ entityId, entityName }: MembersTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Members' Resolutions
        </CardTitle>
        <CardDescription>
          Members' resolutions for {entityName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="text-muted-foreground mb-4">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Members' resolution functionality coming soon...</p>
            <p className="text-sm mt-2">This will include constitutional amendments, director appointments by members, share issues, and other member resolutions.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 