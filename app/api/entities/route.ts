import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ApiResponse, EntityInput, EntityWithRelations } from '@/lib/types'

// GET /api/entities - List all entities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeDetails = searchParams.get('include') === 'details'

    const entities = await prisma.entity.findMany({
      include: includeDetails ? {
        _count: {
          select: {
            members: true,
            securityClasses: true,
            transactions: true
          }
        }
      } : undefined,
      orderBy: {
        name: 'asc'
      }
    })

    const response: ApiResponse<EntityWithRelations[]> = {
      success: true,
      data: entities
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching entities:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch entities'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// POST /api/entities - Create a new entity
export async function POST(request: NextRequest) {
  try {
    const body: EntityInput = await request.json()

    // Validate required fields
    if (!body.name || !body.entityType) {
      const response: ApiResponse = {
        success: false,
        error: 'Name and entity type are required'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Check for duplicate ABN/ACN if provided
    if (body.abn || body.acn) {
      const existing = await prisma.entity.findFirst({
        where: {
          OR: [
            body.abn ? { abn: body.abn } : {},
            body.acn ? { acn: body.acn } : {}
          ].filter(condition => Object.keys(condition).length > 0)
        }
      })

      if (existing) {
        const response: ApiResponse = {
          success: false,
          error: 'Entity with this ABN or ACN already exists'
        }
        return NextResponse.json(response, { status: 409 })
      }
    }

    const entity = await prisma.entity.create({
      data: {
        name: body.name,
        abn: body.abn || null,
        acn: body.acn || null,
        entityType: body.entityType,
        incorporationDate: body.incorporationDate || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        postcode: body.postcode || null,
        country: body.country || 'Australia',
        email: body.email || null,
        phone: body.phone || null,
        website: body.website || null
      }
    })

    const response: ApiResponse<EntityWithRelations> = {
      success: true,
      data: entity,
      message: 'Entity created successfully'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating entity:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create entity'
    }
    return NextResponse.json(response, { status: 500 })
  }
} 