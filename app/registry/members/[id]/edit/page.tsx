'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { MemberForm } from '../../member-form'
import { Member, Entity } from '@/lib/types/interfaces'
import Link from 'next/link'

export default function EditMemberPage() {
    const params = useParams()
    const router = useRouter()
    const memberId = params.id as string

    const [member, setMember] = useState<Member | null>(null)
    const [entities, setEntities] = useState<Entity[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                // Fetch member data
                const memberResponse = await fetch(`/api/registry/members/${memberId}`)
                const memberResult = await memberResponse.json()

                if (!memberResult.success) {
                    setError(memberResult.error || 'Failed to fetch member')
                    return
                }

                setMember(memberResult.data)

                // Fetch entities for the form
                const entitiesResponse = await fetch('/api/entities')
                const entitiesResult = await entitiesResponse.json()

                if (entitiesResult.success) {
                    setEntities(entitiesResult.data)
                } else {
                    console.error('Failed to fetch entities:', entitiesResult.error)
                }
            } catch (error) {
                console.error('Error fetching data:', error)
                setError('Failed to fetch member data')
            } finally {
                setLoading(false)
            }
        }

        if (memberId) {
            fetchData()
        }
    }, [memberId])

    const handleSaved = () => {
        // Redirect to the member view page
        router.push(`/registry/members/${memberId}`)
    }

    const getMemberDisplayName = (member: Member) => {
        if (member.memberType === 'Individual') {
            return `${member.givenNames || ''} ${member.familyName || ''}`.trim()
        }
        if (member.memberType === 'Joint') {
            if (member.givenNames && member.familyName) {
                return `${member.givenNames} ${member.familyName}`.trim()
            }
            return member.entityName || ''
        }
        return member.entityName || ''
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="container mx-auto py-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-2">Loading member details...</span>
                    </div>
                </div>
            </MainLayout>
        )
    }

    if (error || !member) {
        return (
            <MainLayout>
                <div className="container mx-auto py-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Error</CardTitle>
                            <CardDescription>
                                {error || 'Member not found'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2">
                                <Link href="/registry/members">
                                    <Button variant="outline">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Members
                                    </Button>
                                </Link>
                                <Link href={`/registry/members/${memberId}`}>
                                    <Button variant="outline">
                                        View Member
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="container mx-auto py-6">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">
                                Edit Member
                            </h1>
                            <p className="text-muted-foreground">
                                Editing {getMemberDisplayName(member)}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Link href={`/registry/members/${memberId}`}>
                                <Button variant="outline">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Member
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <MemberForm
                        entities={entities}
                        member={member}
                        onSaved={handleSaved}
                        disableScroll={true}
                    />
                </div>
            </div>
        </MainLayout>
    )
} 