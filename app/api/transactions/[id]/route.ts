import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiResponse, TransactionInput } from '@/lib/types';
import { Decimal } from '@prisma/client/runtime/library';

// GET /api/transactions/[id] - Get a specific transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        entity: true,
        securityClass: true,
        fromMember: true,
        toMember: true,
      },
    });

    if (!transaction) {
      const response: ApiResponse = {
        success: false,
        error: 'Transaction not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: transaction,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch transaction',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/transactions/[id] - Update a transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Partial<TransactionInput> = await request.json();

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      const response: ApiResponse = {
        success: false,
        error: 'Transaction not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Build update data object
    const updateData: any = {};

    if (body.transactionType) updateData.transactionType = body.transactionType;
    if (body.quantity !== undefined) updateData.quantity = body.quantity;
    if (body.amountPaidPerSecurity !== undefined) {
      updateData.amountPaidPerSecurity = body.amountPaidPerSecurity
        ? new Decimal(body.amountPaidPerSecurity)
        : null;
    }
    if (body.amountUnpaidPerSecurity !== undefined) {
      updateData.amountUnpaidPerSecurity = body.amountUnpaidPerSecurity
        ? new Decimal(body.amountUnpaidPerSecurity)
        : null;
    }
    if (body.transferPricePerSecurity !== undefined) {
      updateData.transferPricePerSecurity = body.transferPricePerSecurity
        ? new Decimal(body.transferPricePerSecurity)
        : null;
    }
    if (body.fromMemberId !== undefined)
      updateData.fromMemberId = body.fromMemberId;
    if (body.toMemberId !== undefined) updateData.toMemberId = body.toMemberId;
    if (body.trancheNumber !== undefined)
      updateData.trancheNumber = body.trancheNumber;
    if (body.trancheSequence !== undefined)
      updateData.trancheSequence = body.trancheSequence;
    if (body.postedDate) updateData.postedDate = body.postedDate;
    if (body.settlementDate !== undefined)
      updateData.settlementDate = body.settlementDate;
    if (body.reference !== undefined) updateData.reference = body.reference;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.certificateNumber !== undefined)
      updateData.certificateNumber = body.certificateNumber;
    if (body.status) updateData.status = body.status;

    // Recalculate totals if quantity or prices changed
    if (
      body.quantity !== undefined ||
      body.amountPaidPerSecurity !== undefined
    ) {
      const quantity =
        body.quantity !== undefined
          ? body.quantity
          : existingTransaction.quantity;
      const amountPaidPerSecurity =
        body.amountPaidPerSecurity !== undefined
          ? body.amountPaidPerSecurity
          : existingTransaction.amountPaidPerSecurity?.toNumber();

      updateData.totalAmountPaid = amountPaidPerSecurity
        ? new Decimal(amountPaidPerSecurity).mul(quantity)
        : null;
    }

    if (
      body.quantity !== undefined ||
      body.amountUnpaidPerSecurity !== undefined
    ) {
      const quantity =
        body.quantity !== undefined
          ? body.quantity
          : existingTransaction.quantity;
      const amountUnpaidPerSecurity =
        body.amountUnpaidPerSecurity !== undefined
          ? body.amountUnpaidPerSecurity
          : existingTransaction.amountUnpaidPerSecurity?.toNumber();

      updateData.totalAmountUnpaid = amountUnpaidPerSecurity
        ? new Decimal(amountUnpaidPerSecurity).mul(quantity)
        : null;
    }

    if (
      body.quantity !== undefined ||
      body.transferPricePerSecurity !== undefined
    ) {
      const quantity =
        body.quantity !== undefined
          ? body.quantity
          : existingTransaction.quantity;
      const transferPricePerSecurity =
        body.transferPricePerSecurity !== undefined
          ? body.transferPricePerSecurity
          : existingTransaction.transferPricePerSecurity?.toNumber();

      updateData.totalTransferAmount = transferPricePerSecurity
        ? new Decimal(transferPricePerSecurity).mul(quantity)
        : null;
    }

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
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
      message: 'Transaction updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating transaction:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update transaction',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/transactions/[id] - Delete a transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      const response: ApiResponse = {
        success: false,
        error: 'Transaction not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Transaction deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete transaction',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
