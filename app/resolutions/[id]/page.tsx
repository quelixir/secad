'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
    ArrowLeft,
    Edit,
    FileText,
    Calendar,
    User,
    Building2,
    CheckCircle,
    Clock,
    XCircle,
    BookOpen,
    MessageSquare,
    History
} from 'lucide-react'
import { ResolutionForm } from '../resolution-form'

interface Resolution {
    id: string
    title: string
    type: string
    category: string
    description?: string
    content: string
    status: string
    resolutionDate?: string
    effectiveDate?: string
    referenceNumber?: string
    approvedBy?: string
    votingDetails?: string
    notes?: string
    createdAt: string
    updatedAt: string
    createdBy?: string
    entity: {
        id: string
        name: string
    }
}

// Standard directors' resolutions with their legislative sections and descriptions
const STANDARD_DIRECTORS_RESOLUTIONS = [
    {
        type: 'appointment_of_director',
        title: 'Appointment of Director',
        sections: 's201H, s203C',
        description: 'Appoint a person as a director of the company via board resolution.'
    },
    {
        type: 'resignation_of_director',
        title: 'Resignation of Director',
        sections: 's203A, s203C',
        description: 'Accept the resignation of a director and update ASIC accordingly.'
    },
    {
        type: 'removal_of_director',
        title: 'Removal of Director',
        sections: 's203C',
        description: 'Remove a director by resolution (if constitution permits).'
    },
    {
        type: 'appointment_of_company_secretary',
        title: 'Appointment of Company Secretary',
        sections: 's204D',
        description: 'Appoint a company secretary, if the company chooses to have one.'
    },
    {
        type: 'change_of_registered_office',
        title: 'Change of Registered Office',
        sections: 's142',
        description: 'Resolve to change the company\'s registered office and notify ASIC.'
    },
    {
        type: 'issue_of_shares',
        title: 'Issue of Shares',
        sections: 's254A–s254X',
        description: 'Approve the issue of new shares, subject to the replaceable rules or constitution.'
    },
    {
        type: 'transfer_of_shares',
        title: 'Transfer of Shares',
        sections: 's1071B, s1072F',
        description: 'Approve the transfer of shares in the company, usually per constitution.'
    },
    {
        type: 'declaration_of_dividends',
        title: 'Declaration of Dividends',
        sections: 's254U',
        description: 'Resolve to declare and pay a dividend to shareholders.'
    },
    {
        type: 'approval_of_financial_statements',
        title: 'Approval of Financial Statements',
        sections: 's292, s295, s296',
        description: 'Approve the company\'s annual financial reports and directors\' declaration.'
    },
    {
        type: 'lodgement_of_annual_review',
        title: 'Lodgement of Annual Review',
        sections: 's345',
        description: 'Authorise the signing and lodgement of ASIC annual company statement and solvency.'
    },
    {
        type: 'change_of_company_name',
        title: 'Change of Company Name',
        sections: 's157',
        description: 'Resolve to change the company\'s name, subject to shareholder approval.'
    },
    {
        type: 'change_to_company_constitution',
        title: 'Change to Company Constitution',
        sections: 's136',
        description: 'Approve changes to the company\'s constitution (if one exists), subject to shareholder resolution.'
    },
    {
        type: 'adoption_of_a_constitution',
        title: 'Adoption of a Constitution',
        sections: 's136',
        description: 'Adopt a constitution if the company does not already have one.'
    },
    {
        type: 'opening_a_bank_account',
        title: 'Opening a Bank Account',
        sections: '— (common law authority)',
        description: 'Approve the opening of a bank account and designate authorised signatories.'
    },
    {
        type: 'execution_of_contracts',
        title: 'Execution of Contracts',
        sections: 's127',
        description: 'Approve execution of contracts and other documents on behalf of the company.'
    },
    {
        type: 'solvency_resolution',
        title: 'Solvency Resolution',
        sections: 's347A',
        description: 'For large proprietary companies, directors must pass a solvency resolution annually.'
    },
    {
        type: 'loans_to_directors',
        title: 'Loans to Directors',
        sections: 's208, s210, s211',
        description: 'Approve financial benefits (including loans) to directors, ensuring compliance with related party rules.'
    },
    {
        type: 'directors_interests_disclosure',
        title: 'Director\'s Interests Disclosure',
        sections: 's191',
        description: 'Record any director\'s material personal interest in a matter being considered.'
    },
    {
        type: 'calling_a_general_meeting',
        title: 'Calling a General Meeting',
        sections: 's249C',
        description: 'Resolve to call a meeting of members/shareholders.'
    },
    {
        type: 'distribution_of_profits',
        title: 'Distribution of Profits',
        sections: 's254T',
        description: 'Resolve to distribute company profits (dividends) only when the company is solvent.'
    },
    {
        type: 'appointment_of_auditor',
        title: 'Appointment of Auditor',
        sections: 's327A',
        description: 'Appoint an auditor if required (not mandatory for small proprietary companies).'
    },
    {
        type: 'approval_of_related_party_transactions',
        title: 'Approval of Related Party Transactions',
        sections: 's208',
        description: 'Approve related party transactions with proper disclosures and, if required, member approval.'
    },
    {
        type: 'record_of_resolutions_without_meeting',
        title: 'Record of Resolutions Without Meeting',
        sections: 's248A',
        description: 'Confirm that a resolution has been passed without a meeting of directors.'
    },
    {
        type: 'general_business',
        title: 'General Business',
        sections: '—',
        description: 'General business matter for board consideration.'
    }
]

export default function ResolutionDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [resolution, setResolution] = useState<Resolution | null>(null)
    const [loading, setLoading] = useState(true)
    const [showEditDialog, setShowEditDialog] = useState(false)

    const fetchResolution = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/resolutions/${params.id}`)
            const result = await response.json()

            if (result.success) {
                setResolution(result.data)
            } else {
                console.error('Failed to fetch resolution:', result.error)
            }
        } catch (error) {
            console.error('Error fetching resolution:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (params.id) {
            fetchResolution()
        }
    }, [params.id])

    const handleResolutionSaved = () => {
        setShowEditDialog(false)
        fetchResolution()
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Approved':
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case 'Draft':
                return <Clock className="h-4 w-4 text-yellow-600" />
            case 'Rejected':
                return <XCircle className="h-4 w-4 text-red-600" />
            default:
                return <Clock className="h-4 w-4 text-gray-600" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved':
                return 'bg-green-100 text-green-800'
            case 'Draft':
                return 'bg-yellow-100 text-yellow-800'
            case 'Rejected':
                return 'bg-red-100 text-red-800'
            case 'Superseded':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const formatResolutionType = (type: string) => {
        const standardResolution = STANDARD_DIRECTORS_RESOLUTIONS.find(r => r.type === type)
        return standardResolution ? standardResolution.title : type
    }

    const getResolutionInfo = (type: string) => {
        return STANDARD_DIRECTORS_RESOLUTIONS.find(r => r.type === type)
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4">Loading resolution...</p>
                </div>
            </MainLayout>
        )
    }

    if (!resolution) {
        return (
            <MainLayout>
                <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium mb-2">Resolution Not Found</h3>
                    <p className="text-muted-foreground mb-4">
                        The resolution you're looking for doesn't exist or has been deleted.
                    </p>
                    <Button onClick={() => router.push('/resolutions')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Resolutions
                    </Button>
                </div>
            </MainLayout>
        )
    }

    const resolutionInfo = getResolutionInfo(resolution.type)

    return (
        <MainLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/resolutions')}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Resolutions
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{resolution.title}</h1>
                            <p className="text-muted-foreground">
                                {resolution.entity.name} • {formatResolutionType(resolution.type)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={`flex items-center gap-1 ${getStatusColor(resolution.status)}`}>
                            {getStatusIcon(resolution.status)}
                            {resolution.status}
                        </Badge>
                        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
                                <DialogHeader>
                                    <DialogTitle>Edit Resolution</DialogTitle>
                                    <DialogDescription>
                                        Update the resolution details
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
                                    <ResolutionForm
                                        entityId={resolution.entity.id}
                                        entityName={resolution.entity.name}
                                        resolution={resolution}
                                        onSaved={handleResolutionSaved}
                                    />
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Resolution Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <Tabs defaultValue="content" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="content">Content</TabsTrigger>
                                <TabsTrigger value="legislative">Legislative Info</TabsTrigger>
                                <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                            </TabsList>

                            <TabsContent value="content" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Resolution Content
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="prose prose-sm max-w-none">
                                            <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg">
                                                {resolution.content}
                                            </pre>
                                        </div>
                                    </CardContent>
                                </Card>

                                {resolution.notes && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <MessageSquare className="h-5 w-5" />
                                                Notes
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">{resolution.notes}</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>

                            <TabsContent value="legislative" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <BookOpen className="h-5 w-5" />
                                            Legislative Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {resolutionInfo ? (
                                            <>
                                                <div>
                                                    <h4 className="font-medium mb-2">Relevant Sections</h4>
                                                    <p className="text-sm text-muted-foreground font-mono">
                                                        {resolutionInfo.sections}
                                                    </p>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium mb-2">Description</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {resolutionInfo.description}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                No specific legislative information available for this resolution type.
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="audit" className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <History className="h-5 w-5" />
                                            Audit Trail
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-3 border rounded-lg">
                                                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">Resolution Created</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(resolution.createdAt).toLocaleString()}
                                                        {resolution.createdBy && ` by ${resolution.createdBy}`}
                                                    </p>
                                                </div>
                                            </div>

                                            {resolution.updatedAt !== resolution.createdAt && (
                                                <div className="flex items-center gap-3 p-3 border rounded-lg">
                                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">Resolution Updated</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(resolution.updatedAt).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {resolution.resolutionDate && (
                                                <div className="flex items-center gap-3 p-3 border rounded-lg">
                                                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">Resolution Passed</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(resolution.resolutionDate).toLocaleDateString()}
                                                            {resolution.approvedBy && ` by ${resolution.approvedBy}`}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Resolution Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">{resolution.entity.name}</span>
                                </div>

                                {resolution.referenceNumber && (
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{resolution.referenceNumber}</span>
                                    </div>
                                )}

                                {resolution.resolutionDate && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Resolution Date</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(resolution.resolutionDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {resolution.effectiveDate && (
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Effective Date</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(resolution.effectiveDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {resolution.approvedBy && (
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Approved By</p>
                                            <p className="text-xs text-muted-foreground">{resolution.approvedBy}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Description */}
                        {resolution.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{resolution.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Voting Details */}
                        {resolution.votingDetails && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Voting Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{resolution.votingDetails}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    )
} 