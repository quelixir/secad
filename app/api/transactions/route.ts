import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiResponse, TransactionInput } from '@/lib/types';
import { Decimal } from '@prisma/client/runtime/library';
import { getDefaultCurrencyCode } from '@/lib/config';

// GET /api/transactions - List all transactions (optionally filtered by entity)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    const memberId = searchParams.get('memberId');
    const transactionType = searchParams.get('transactionType');

    const whereClause: any = {};

    if (entityId) {
      whereClause.entityId = entityId;
    }

    if (memberId) {
      whereClause.OR = [{ fromMemberId: memberId }, { toMemberId: memberId }];
    }

    if (transactionType) {
      whereClause.transactionType = transactionType;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        entity: true,
        securityClass: true,
        fromMember: true,
        toMember: true,
      },
      orderBy: {
        settlementDate: 'desc',
      },
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: transactions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch transactions',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const body: TransactionInput = await request.json();
    const {
      entityId,
      securityClassId,
      transactionType,
      reasonCode,
      quantity,
      amountPaidPerSecurity,
      amountUnpaidPerSecurity,
      currencyCode,
      fromMemberId,
      toMemberId,
      trancheNumber,
      trancheSequence,
      postedDate,
      settlementDate,
      reference,
      description,
      certificateNumber,
      status = 'Completed',
    } = body;

    // Validate required fields
    if (
      !entityId ||
      !securityClassId ||
      !transactionType ||
      !reasonCode ||
      !quantity
    ) {
      const response: ApiResponse = {
        success: false,
        error: 'Missing required fields',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate transaction type specific requirements
    if (transactionType === 'ISSUE') {
      if (fromMemberId !== null) {
        const response: ApiResponse = {
          success: false,
          error:
            'ISSUE transactions must have fromMemberId as null (entity issuing)',
        };
        return NextResponse.json(response, { status: 400 });
      }
      if (!toMemberId) {
        const response: ApiResponse = {
          success: false,
          error: 'ISSUE transactions must have a toMemberId',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    if (transactionType === 'TRANSFER') {
      if (!fromMemberId || !toMemberId) {
        const response: ApiResponse = {
          success: false,
          error:
            'TRANSFER transactions must have both fromMemberId and toMemberId',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    if (transactionType === 'CANCELLATION') {
      if (!fromMemberId) {
        const response: ApiResponse = {
          success: false,
          error: 'CANCELLATION transactions must have a fromMemberId',
        };
        return NextResponse.json(response, { status: 400 });
      }
      if (toMemberId !== null) {
        const response: ApiResponse = {
          success: false,
          error: 'CANCELLATION transactions must have toMemberId as null',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    if (transactionType === 'REDEMPTION') {
      if (!fromMemberId) {
        const response: ApiResponse = {
          success: false,
          error: 'REDEMPTION transactions must have a fromMemberId',
        };
        return NextResponse.json(response, { status: 400 });
      }
      if (toMemberId !== null) {
        const response: ApiResponse = {
          success: false,
          error: 'REDEMPTION transactions must have toMemberId as null',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    if (transactionType === 'RETURN_OF_CAPITAL') {
      if (!fromMemberId) {
        const response: ApiResponse = {
          success: false,
          error: 'RETURN_OF_CAPITAL transactions must have a fromMemberId',
        };
        return NextResponse.json(response, { status: 400 });
      }
      if (toMemberId !== null) {
        const response: ApiResponse = {
          success: false,
          error: 'RETURN_OF_CAPITAL transactions must have toMemberId as null',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    if (transactionType === 'CAPITAL_CALL') {
      if (!fromMemberId) {
        const response: ApiResponse = {
          success: false,
          error: 'CAPITAL_CALL transactions must have a fromMemberId',
        };
        return NextResponse.json(response, { status: 400 });
      }
      if (toMemberId !== null) {
        const response: ApiResponse = {
          success: false,
          error: 'CAPITAL_CALL transactions must have toMemberId as null',
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Calculate totals
    const totalAmountPaid = amountPaidPerSecurity
      ? new Decimal(amountPaidPerSecurity).mul(quantity)
      : null;
    const totalAmountUnpaid = amountUnpaidPerSecurity
      ? new Decimal(amountUnpaidPerSecurity).mul(quantity)
      : null;

    const transaction = await prisma.transaction.create({
      data: {
        entityId,
        securityClassId,
        transactionType,
        reasonCode,
        quantity,
        amountPaidPerSecurity: amountPaidPerSecurity
          ? new Decimal(amountPaidPerSecurity)
          : null,
        amountUnpaidPerSecurity: amountUnpaidPerSecurity
          ? new Decimal(amountUnpaidPerSecurity)
          : null,
        currencyCode: currencyCode || getDefaultCurrencyCode(),
        totalAmountPaid,
        totalAmountUnpaid,
        fromMemberId,
        toMemberId,
        trancheNumber,
        trancheSequence,
        postedDate: postedDate ? new Date(postedDate) : new Date(),
        settlementDate,
        reference,
        description,
        certificateNumber,
        status,
      },
      include: {
        entity: true,
        securityClass: true,
        fromMember: true,
        toMember: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: transaction,
      message: 'Transaction created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create transaction',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
