import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';

// GET /api/securities/summary - Get securities summary with totals per class
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    if (!entityId) {
      const response: ApiResponse = {
        success: false,
        error: 'Entity ID is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Get all security classes for the entity with their transactions
    const whereClause: any = { entityId };
    if (!includeArchived) {
      whereClause.isArchived = false;
    }

    const securityClasses = await prisma.securityClass.findMany({
      where: whereClause,
      include: {
        transactions: {
          where: { status: 'Completed' },
          include: {
            fromMember: true,
            toMember: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Calculate totals for each security class
    const summary = securityClasses.map((securityClass) => {
      // Calculate totals from transactions
      let totalQuantity = 0;
      let totalAmountPaid = 0;
      let totalAmountUnpaid = 0;
      const memberIds = new Set<string>();
      const trancheNumbers = new Set<string>();

      securityClass.transactions.forEach((transaction) => {
        if (transaction.transactionType === 'ISSUE') {
          // Add quantities and amounts for ISSUE transactions
          totalQuantity += transaction.quantity;
          totalAmountPaid += transaction.totalAmountPaid
            ? parseFloat(transaction.totalAmountPaid.toString())
            : 0;
          totalAmountUnpaid += transaction.totalAmountUnpaid
            ? parseFloat(transaction.totalAmountUnpaid.toString())
            : 0;
          if (transaction.toMember) {
            memberIds.add(transaction.toMember.id);
          }
          if (transaction.trancheNumber) {
            trancheNumbers.add(transaction.trancheNumber);
          }
        } else if (transaction.transactionType === 'TRANSFER') {
          // For TRANSFER transactions, we need to track net movements
          // This is a simplified approach - in a real system you'd want more sophisticated tracking
          if (transaction.toMember) {
            memberIds.add(transaction.toMember.id);
          }
        } else if (transaction.transactionType === 'CANCELLATION') {
          // Subtract quantities for CANCELLATION transactions
          totalQuantity -= transaction.quantity;
          totalAmountPaid -= transaction.totalAmountPaid
            ? parseFloat(transaction.totalAmountPaid.toString())
            : 0;
          totalAmountUnpaid -= transaction.totalAmountUnpaid
            ? parseFloat(transaction.totalAmountUnpaid.toString())
            : 0;
        }
      });

      // Group transactions by tranche for display
      const trancheGroups = new Map<string, any>();
      securityClass.transactions
        .filter((t) => t.transactionType === 'ISSUE')
        .forEach((transaction) => {
          const trancheNumber = transaction.trancheNumber || 'Unknown';
          if (!trancheGroups.has(trancheNumber)) {
            trancheGroups.set(trancheNumber, {
              id: transaction.id,
              trancheNumber,
              issueDate: transaction.transactionDate,
              quantity: 0,
              amountPaidPerSecurity: transaction.amountPaidPerSecurity,
              amountUnpaidPerSecurity: transaction.amountUnpaidPerSecurity,
              totalAmountPaid: 0,
              totalAmountUnpaid: 0,
              currency: 'AUD',
              reference: transaction.reference,
              description: transaction.description,
              allocationCount: 0,
            });
          }
          const tranche = trancheGroups.get(trancheNumber)!;
          tranche.quantity += transaction.quantity;
          tranche.totalAmountPaid += transaction.totalAmountPaid
            ? parseFloat(transaction.totalAmountPaid.toString())
            : 0;
          tranche.totalAmountUnpaid += transaction.totalAmountUnpaid
            ? parseFloat(transaction.totalAmountUnpaid.toString())
            : 0;
          tranche.allocationCount += 1;
        });

      return {
        id: securityClass.id,
        name: securityClass.name,
        symbol: securityClass.symbol,
        description: securityClass.description,
        votingRights: securityClass.votingRights,
        dividendRights: securityClass.dividendRights,
        isActive: securityClass.isActive,
        isArchived: securityClass.isArchived,
        totalQuantity,
        totalAmountPaid,
        totalAmountUnpaid,
        currency: 'AUD',
        trancheCount: trancheNumbers.size,
        memberCount: memberIds.size,
        tranches: Array.from(trancheGroups.values()),
      };
    });

    const response: ApiResponse = {
      success: true,
      data: summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching securities summary:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch securities summary',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
