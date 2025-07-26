import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { AuditLogger, AuditTableName } from '@/lib/audit';
import { auth } from '@/lib/auth';
import { getDefaultCurrencyCode } from '@/lib/config';

/**
 * POST /api/registry/transactions/bulk
 *
 * Creates multiple transactions atomically in a single database transaction.
 * This endpoint is designed for bulk operations like capital raises, dividend
 * reinvestment plans, or large-scale share transfers.
 *
 * Key Features:
 * - Atomic operations: All transactions succeed or all fail
 * - Validation: Checks security class status and member existence
 * - Audit logging: Each transaction is logged individually
 * - Partly paid shares: Supports paid/unpaid per security amounts
 *
 * @param request - Contains entityId, securityClassId, type, and array of transactions
 * @returns Array of created transactions with success message
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.entityId) {
      const response: ApiResponse = {
        success: false,
        error: 'Entity ID is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!body.securityClassId) {
      const response: ApiResponse = {
        success: false,
        error: 'Security class ID is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!body.type) {
      const response: ApiResponse = {
        success: false,
        error: 'Transaction type is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (
      !body.transactions ||
      !Array.isArray(body.transactions) ||
      body.transactions.length === 0
    ) {
      const response: ApiResponse = {
        success: false,
        error: 'At least one transaction is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if security class exists and is not archived
    const securityClass = await prisma.securityClass.findUnique({
      where: { id: body.securityClassId },
    });

    if (!securityClass) {
      const response: ApiResponse = {
        success: false,
        error: 'Security class not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    if (securityClass.isArchived) {
      const response: ApiResponse = {
        success: false,
        error: 'Cannot create transactions for archived security class',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate all members exist
    const memberIds = new Set<string>();
    body.transactions.forEach((transaction: any) => {
      if (transaction.fromMemberId) memberIds.add(transaction.fromMemberId);
      if (transaction.toMemberId) memberIds.add(transaction.toMemberId);
    });

    if (memberIds.size > 0) {
      const members = await prisma.member.findMany({
        where: { id: { in: Array.from(memberIds) } },
      });

      if (members.length !== memberIds.size) {
        const response: ApiResponse = {
          success: false,
          error: 'One or more members not found',
        };
        return NextResponse.json(response, { status: 404 });
      }
    }

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

    // Create all transactions in a transaction
    const createdTransactions = await prisma.$transaction(async (tx) => {
      const transactions = [];

      for (const transactionData of body.transactions) {
        const quantity = parseInt(transactionData.quantity);
        const paidPerSecurity = transactionData.paidPerSecurity
          ? parseFloat(transactionData.paidPerSecurity)
          : 0;
        const unpaidPerSecurity = transactionData.unpaidPerSecurity
          ? parseFloat(transactionData.unpaidPerSecurity)
          : 0;

        const totalAmountPaid = quantity * paidPerSecurity;
        const totalAmountUnpaid = quantity * unpaidPerSecurity;

        const transaction = await tx.transaction.create({
          data: {
            entityId: body.entityId,
            securityClassId: body.securityClassId,
            transactionType: body.type,
            quantity,
            reasonCode: body.reasonCode,
            amountPaidPerSecurity: paidPerSecurity > 0 ? paidPerSecurity : null,
            amountUnpaidPerSecurity:
              unpaidPerSecurity > 0 ? unpaidPerSecurity : null,
            currencyCode: body.currencyCode || getDefaultCurrencyCode(),
            totalAmountPaid: totalAmountPaid > 0 ? totalAmountPaid : null,
            totalAmountUnpaid: totalAmountUnpaid > 0 ? totalAmountUnpaid : null,
            fromMemberId: transactionData.fromMemberId || null,
            toMemberId: transactionData.toMemberId || null,
            postedDate: body.postedDate
              ? new Date(body.postedDate)
              : new Date(),
            reference: transactionData.reference || body.reference || null,
            description:
              transactionData.description || body.description || null,
            status: 'Completed',
            createdBy: userId, // Use actual user ID from auth
          },
          include: {
            entity: true,
            securityClass: true,
            fromMember: true,
            toMember: true,
          },
        });

        transactions.push(transaction);

        // Log the creation
        await AuditLogger.logCreate(
          body.entityId,
          userId, // Use actual user ID from auth
          AuditTableName.TRANSACTION,
          transaction.id,
          transaction
        );
      }

      return transactions;
    });

    const response: ApiResponse = {
      success: true,
      data: {
        transactions: createdTransactions,
        count: createdTransactions.length,
      },
      message: `Successfully created ${createdTransactions.length} transactions`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating bulk transactions:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create bulk transactions',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
