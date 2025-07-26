import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiResponse, TransactionInput } from '@/lib/types';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditLogger } from '@/lib/audit';
import { AuditTableName } from '@/lib/audit';
import { auth } from '@/lib/auth';
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

    // Map the response to match the expected interface
    const mappedTransactions = transactions.map((transaction) => ({
      ...transaction,
      security: transaction.securityClass, // Map securityClass to security
    }));

    const response: ApiResponse<any[]> = {
      success: true,
      data: mappedTransactions,
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
    // Get user session from auth
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized',
      };
      return NextResponse.json(response, { status: 401 });
    }
    const body: TransactionInput = await request.json();
    const {
      entityId,
      securityClassId,
      transactionType,
      reasonCode,
      quantity,
      amountPaidPerSecurity,
      amountUnpaidPerSecurity,
      transferPricePerSecurity,
      currencyCode: currency,
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
    const totalTransferAmount = transferPricePerSecurity
      ? new Decimal(transferPricePerSecurity).mul(quantity)
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
        transferPricePerSecurity: transferPricePerSecurity
          ? new Decimal(transferPricePerSecurity)
          : null,
        currencyCode: currency || getDefaultCurrencyCode(),
        totalAmountPaid,
        totalAmountUnpaid,
        totalTransferAmount,
        fromMemberId,
        toMemberId,
        trancheNumber,
        trancheSequence,
        postedDate: postedDate || new Date(),
        settlementDate: settlementDate || new Date(),
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

    // Log the creation
    await AuditLogger.logCreate(
      entityId,
      userId, // Use actual user ID from auth
      AuditTableName.TRANSACTION,
      transaction.id,
      transaction
    );

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
