import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ApiResponse, ResolutionInput } from '@/lib/types'

// GET /api/resolutions - List all resolutions (optionally filtered by entity and category)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entityId')
    const category = searchParams.get('category') // 'directors' or 'members'
    const status = searchParams.get('status')

    const whereClause: any = {}
    if (entityId) whereClause.entityId = entityId
    if (category) whereClause.category = category
    if (status) whereClause.status = status

    const resolutions = await prisma.resolution.findMany({
      where: whereClause,
      include: {
        entity: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { resolutionDate: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    const response: ApiResponse<any[]> = {
      success: true,
      data: resolutions
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching resolutions:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch resolutions'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// POST /api/resolutions - Create a new resolution
export async function POST(request: NextRequest) {
  try {
    const body: ResolutionInput = await request.json()

    // Validate required fields
    if (!body.entityId || !body.title || !body.type || !body.category || !body.content) {
      const response: ApiResponse = {
        success: false,
        error: 'Entity ID, title, type, category, and content are required'
      }
      return NextResponse.json(response, { status: 400 })
    }

    const resolution = await prisma.resolution.create({
      data: {
        entityId: body.entityId,
        title: body.title,
        type: body.type,
        category: body.category,
        description: body.description || null,
        content: body.content,
        status: body.status || 'Draft',
        resolutionDate: body.resolutionDate || null,
        effectiveDate: body.effectiveDate || null,
        approvedBy: body.approvedBy || null,
        votingDetails: body.votingDetails || null,
        referenceNumber: body.referenceNumber || null,
        attachments: body.attachments || [],
        relatedPersonId: body.relatedPersonId || null,
        notes: body.notes || null,
        createdBy: body.createdBy || null
      },
      include: {
        entity: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const response: ApiResponse<any> = {
      success: true,
      data: resolution,
      message: 'Resolution created successfully'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating resolution:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create resolution'
    }
    return NextResponse.json(response, { status: 500 })
  }
} 