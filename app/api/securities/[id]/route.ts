import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ApiResponse, SecurityClassInput } from '@/lib/types'

// GET /api/securities/[id] - Get a specific security class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeHoldings = searchParams.get('include')?.includes('holdings')
    const includeTransactions = searchParams.get('include')?.includes('transactions')

    const securityClass = await prisma.securityClass.findUnique({
      where: { id },
      include: {
        entity: true,
        holdings: includeHoldings ? {
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                entityName: true,
                memberType: true,
                memberNumber: true
              }
            }
          }
        } : false,
        transactions: includeTransactions ? {
          include: {
            fromMember: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                entityName: true,
                memberType: true
              }
            },
            toMember: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                entityName: true,
                memberType: true
              }
            }
          },
          orderBy: {
            transactionDate: 'desc'
          }
        } : false,
        _count: {
          select: {
            holdings: true,
            transactions: true
          }
        }
      }
    })

    if (!securityClass) {
      const response: ApiResponse = {
        success: false,
        error: 'Security class not found'
      }
      return NextResponse.json(response, { status: 404 })
    }

    const response: ApiResponse = {
      success: true,
      data: securityClass
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching security class:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch security class'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// PUT /api/securities/[id] - Update a security class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: Partial<SecurityClassInput> = await request.json()

    // Check if security class exists
    const existingSecurity = await prisma.securityClass.findUnique({
      where: { id }
    })

    if (!existingSecurity) {
      const response: ApiResponse = {
        success: false,
        error: 'Security class not found'
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Check for duplicate name if being updated and within same entity
    if (body.name && body.name !== existingSecurity.name) {
      const duplicate = await prisma.securityClass.findFirst({
        where: {
          entityId: existingSecurity.entityId,
          name: body.name,
          id: { not: id }
        }
      })

      if (duplicate) {
        const response: ApiResponse = {
          success: false,
          error: 'Security class name already exists for this entity'
        }
        return NextResponse.json(response, { status: 409 })
      }
    }

    // Build update data object
    const updateData: any = {}
    if (body.name) updateData.name = body.name
    if (body.symbol !== undefined) updateData.symbol = body.symbol || null
    if (body.description !== undefined) updateData.description = body.description || null
    if (body.votingRights !== undefined) updateData.votingRights = body.votingRights
    if (body.dividendRights !== undefined) updateData.dividendRights = body.dividendRights
    if (body.parValue !== undefined) updateData.parValue = body.parValue || null
    if (body.currency) updateData.currency = body.currency

    const securityClass = await prisma.securityClass.update({
      where: { id },
      data: updateData,
      include: {
        entity: true,
        _count: {
          select: {
            holdings: true,
            transactions: true
          }
        }
      }
    })

    const response: ApiResponse = {
      success: true,
      data: securityClass,
      message: 'Security class updated successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating security class:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update security class'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// DELETE /api/securities/[id] - Delete a security class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if security class exists and get holding/transaction counts
    const existingSecurity = await prisma.securityClass.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            holdings: true,
            transactions: true
          }
        }
      }
    })

    if (!existingSecurity) {
      const response: ApiResponse = {
        success: false,
        error: 'Security class not found'
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Check if security class has holdings or transactions
    if (existingSecurity._count.holdings > 0 || existingSecurity._count.transactions > 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Cannot delete security class with existing holdings or transactions'
      }
      return NextResponse.json(response, { status: 409 })
    }

    await prisma.securityClass.delete({
      where: { id }
    })

    const response: ApiResponse = {
      success: true,
      message: 'Security class deleted successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error deleting security class:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete security class'
    }
    return NextResponse.json(response, { status: 500 })
  }
} 