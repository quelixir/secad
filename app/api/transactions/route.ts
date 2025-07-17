import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ApiResponse, TransactionInput, TransactionType } from '@/lib/types'

// GET /api/transactions - List all transactions (optionally filtered by entity or member)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityId = searchParams.get('entityId')
    const memberId = searchParams.get('memberId')
    const securityClassId = searchParams.get('securityClassId')

    const whereClause: any = {}
    if (entityId) whereClause.entityId = entityId
    if (securityClassId) whereClause.securityClassId = securityClassId
    if (memberId) {
      whereClause.OR = [
        { fromMemberId: memberId },
        { toMemberId: memberId }
      ]
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        entity: {
          select: {
            id: true,
            name: true
          }
        },
        securityClass: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        },
        fromMember: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            entityName: true,
            memberType: true,
            memberNumber: true
          }
        },
        toMember: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            entityName: true,
            memberType: true,
            memberNumber: true
          }
        }
      },
      orderBy: {
        transactionDate: 'desc'
      }
    })

    const response: ApiResponse<any[]> = {
      success: true,
      data: transactions
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch transactions'
    }
    return NextResponse.json(response, { status: 500 })
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const body: TransactionInput = await request.json()

    // Validate required fields
    if (!body.entityId || !body.securityClassId || !body.type || !body.quantity) {
      const response: ApiResponse = {
        success: false,
        error: 'Entity ID, security class ID, transaction type, and quantity are required'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Validate transaction type
    if (!Object.values(TransactionType).includes(body.type as any)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid transaction type'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Validate quantity is positive
    if (body.quantity <= 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Quantity must be positive'
      }
      return NextResponse.json(response, { status: 400 })
    }

    // Check if entity exists
    const entity = await prisma.entity.findUnique({
      where: { id: body.entityId }
    })

    if (!entity) {
      const response: ApiResponse = {
        success: false,
        error: 'Entity not found'
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Check if security class exists and belongs to the entity
    const securityClass = await prisma.securityClass.findFirst({
      where: {
        id: body.securityClassId,
        entityId: body.entityId
      }
    })

    if (!securityClass) {
      const response: ApiResponse = {
        success: false,
        error: 'Security class not found or does not belong to this entity'
      }
      return NextResponse.json(response, { status: 404 })
    }

    // Validate transaction type specific requirements
    if (body.type === TransactionType.ISSUE) {
      if (!body.toMemberId) {
        const response: ApiResponse = {
          success: false,
          error: 'To member is required for issuance transactions'
        }
        return NextResponse.json(response, { status: 400 })
      }
    } else if (body.type === TransactionType.TRANSFER) {
      if (!body.fromMemberId || !body.toMemberId) {
        const response: ApiResponse = {
          success: false,
          error: 'Both from and to members are required for transfer transactions'
        }
        return NextResponse.json(response, { status: 400 })
      }
      if (body.fromMemberId === body.toMemberId) {
        const response: ApiResponse = {
          success: false,
          error: 'From and to members cannot be the same'
        }
        return NextResponse.json(response, { status: 400 })
      }
    } else if (body.type === TransactionType.REDEMPTION) {
      if (!body.fromMemberId) {
        const response: ApiResponse = {
          success: false,
          error: 'From member is required for redemption transactions'
        }
        return NextResponse.json(response, { status: 400 })
      }
    }

    // Validate members exist and belong to the entity if specified
    if (body.fromMemberId) {
      const fromMember = await prisma.member.findFirst({
        where: {
          id: body.fromMemberId,
          entityId: body.entityId
        }
      })
      if (!fromMember) {
        const response: ApiResponse = {
          success: false,
          error: 'From member not found or does not belong to this entity'
        }
        return NextResponse.json(response, { status: 404 })
      }
    }

    if (body.toMemberId) {
      const toMember = await prisma.member.findFirst({
        where: {
          id: body.toMemberId,
          entityId: body.entityId
        }
      })
      if (!toMember) {
        const response: ApiResponse = {
          success: false,
          error: 'To member not found or does not belong to this entity'
        }
        return NextResponse.json(response, { status: 404 })
      }
    }

    // Validate holdings for transfer/redemption transactions
    if (body.type === TransactionType.TRANSFER || body.type === TransactionType.REDEMPTION) {
      const holding = await prisma.holding.findFirst({
        where: {
          memberId: body.fromMemberId!,
          securityClassId: body.securityClassId
        }
      })

      if (!holding || holding.quantity < body.quantity) {
        const response: ApiResponse = {
          success: false,
          error: 'Insufficient holdings for this transaction'
        }
        return NextResponse.json(response, { status: 400 })
      }
    }

    // Calculate total amount if price per security is provided
    const totalAmount = body.pricePerSecurity ? 
      (body.pricePerSecurity * body.quantity).toString() : 
      body.totalAmount

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        entityId: body.entityId,
        securityClassId: body.securityClassId,
        type: body.type,
        quantity: body.quantity,
        pricePerSecurity: body.pricePerSecurity?.toString() || null,
        totalAmount: totalAmount || null,
        fromMemberId: body.fromMemberId || null,
        toMemberId: body.toMemberId || null,
        transactionDate: body.transactionDate || new Date(),
        reference: body.reference || null,
        description: body.description || null
      },
      include: {
        entity: true,
        securityClass: true,
        fromMember: true,
        toMember: true
      }
    })

    // Update holdings based on transaction type
    if (body.type === TransactionType.ISSUE) {
      // Create or update holding for the recipient
      await prisma.holding.upsert({
        where: {
          memberId_securityClassId: {
            memberId: body.toMemberId!,
            securityClassId: body.securityClassId
          }
        },
        update: {
          quantity: {
            increment: body.quantity
          }
        },
        create: {
          memberId: body.toMemberId!,
          securityClassId: body.securityClassId,
          quantity: body.quantity
        }
      })
    } else if (body.type === TransactionType.TRANSFER) {
      // Decrease from member's holding
      await prisma.holding.update({
        where: {
          memberId_securityClassId: {
            memberId: body.fromMemberId!,
            securityClassId: body.securityClassId
          }
        },
        data: {
          quantity: {
            decrement: body.quantity
          }
        }
      })

      // Create or update holding for the recipient
      await prisma.holding.upsert({
        where: {
          memberId_securityClassId: {
            memberId: body.toMemberId!,
            securityClassId: body.securityClassId
          }
        },
        update: {
          quantity: {
            increment: body.quantity
          }
        },
        create: {
          memberId: body.toMemberId!,
          securityClassId: body.securityClassId,
          quantity: body.quantity
        }
      })
    } else if (body.type === TransactionType.REDEMPTION) {
      // Decrease from member's holding
      await prisma.holding.update({
        where: {
          memberId_securityClassId: {
            memberId: body.fromMemberId!,
            securityClassId: body.securityClassId
          }
        },
        data: {
          quantity: {
            decrement: body.quantity
          }
        }
      })
    }

    const response: ApiResponse<any> = {
      success: true,
      data: transaction,
      message: 'Transaction created successfully'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create transaction'
    }
    return NextResponse.json(response, { status: 500 })
  }
} 