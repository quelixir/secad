import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiResponse, TransactionInput } from "@/lib/types";
import { Decimal } from "@prisma/client/runtime/library";
import { AuditLogger } from "@/lib/audit";
import { AuditAction, AuditTableName } from "@/lib/audit";
import { auth } from "@/lib/auth";

// GET /api/transactions/[id] - Get a specific transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        error: "Transaction not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: transaction,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching transaction:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to fetch transaction",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/transactions/[id] - Update a transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        error: "Transaction not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Build update data object and track old values for audit logging
    const updateData: any = {};
    const oldValues: Record<string, any> = {};

    if (body.transactionType) {
      oldValues.transactionType = existingTransaction.transactionType;
      updateData.transactionType = body.transactionType;
    }
    if (body.quantity !== undefined) {
      oldValues.quantity = existingTransaction.quantity;
      updateData.quantity = body.quantity;
    }
    if (body.amountPaidPerSecurity !== undefined) {
      oldValues.amountPaidPerSecurity =
        existingTransaction.amountPaidPerSecurity?.toNumber();
      updateData.amountPaidPerSecurity = body.amountPaidPerSecurity
        ? new Decimal(body.amountPaidPerSecurity)
        : null;
    }
    if (body.amountUnpaidPerSecurity !== undefined) {
      oldValues.amountUnpaidPerSecurity =
        existingTransaction.amountUnpaidPerSecurity?.toNumber();
      updateData.amountUnpaidPerSecurity = body.amountUnpaidPerSecurity
        ? new Decimal(body.amountUnpaidPerSecurity)
        : null;
    }
    if (body.fromMemberId !== undefined) {
      oldValues.fromMemberId = existingTransaction.fromMemberId;
      updateData.fromMemberId = body.fromMemberId;
    }
    if (body.toMemberId !== undefined) {
      oldValues.toMemberId = existingTransaction.toMemberId;
      updateData.toMemberId = body.toMemberId;
    }
    if (body.trancheNumber !== undefined) {
      oldValues.trancheNumber = existingTransaction.trancheNumber;
      updateData.trancheNumber = body.trancheNumber;
    }
    if (body.trancheSequence !== undefined) {
      oldValues.trancheSequence = existingTransaction.trancheSequence;
      updateData.trancheSequence = body.trancheSequence;
    }
    if (body.postedDate) {
      oldValues.postedDate = existingTransaction.postedDate;
      updateData.postedDate = body.postedDate;
    }
    if (body.settlementDate !== undefined) {
      oldValues.settlementDate = existingTransaction.settlementDate;
      updateData.settlementDate = body.settlementDate;
    }
    if (body.reference !== undefined) {
      oldValues.reference = existingTransaction.reference;
      updateData.reference = body.reference;
    }
    if (body.description !== undefined) {
      oldValues.description = existingTransaction.description;
      updateData.description = body.description;
    }
    if (body.certificateNumber !== undefined) {
      oldValues.certificateNumber = existingTransaction.certificateNumber;
      updateData.certificateNumber = body.certificateNumber;
    }
    if (body.status) {
      oldValues.status = existingTransaction.status;
      updateData.status = body.status;
    }

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

    // Get user session from auth
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "Unauthorized",
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Log only the fields that have actually changed
    const changedFields = AuditLogger.getChangedFields(oldValues, updateData);
    if (Object.keys(changedFields).length > 0) {
      await AuditLogger.logRecordChanges(
        existingTransaction.entityId,
        userId, // Use actual user ID from auth
        AuditAction.UPDATE,
        AuditTableName.TRANSACTION,
        id,
        changedFields,
      );
    }

    const response: ApiResponse = {
      success: true,
      data: transaction,
      message: "Transaction updated successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating transaction:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to update transaction",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/transactions/[id] - Delete a transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        error: "Transaction not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Get user session from auth
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: "Unauthorized",
      };
      return NextResponse.json(response, { status: 401 });
    }

    // Log the deletion
    await AuditLogger.logDelete(
      existingTransaction.entityId,
      userId, // Use actual user ID from auth
      AuditTableName.TRANSACTION,
      id,
      existingTransaction,
    );

    await prisma.transaction.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: "Transaction deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error deleting transaction:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to delete transaction",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
