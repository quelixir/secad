import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/lib/trpc';
import { prisma } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { getDefaultCurrency } from '@/lib/config';

const transactionInputSchema = z.object({
  entityId: z.string(),
  securityClassId: z.string(),
  transactionType: z.string().min(1, 'Transaction type is required'),
  reasonCode: z.string().min(1, 'Reason code is required'),
  quantity: z.number().positive('Quantity must be positive'),
  amountPaidPerSecurity: z.number().optional(),
  amountUnpaidPerSecurity: z.number().optional(),
  transferPricePerSecurity: z.number().optional(),
  currency: z.string().default(getDefaultCurrency()),
  fromMemberId: z.string().optional(),
  toMemberId: z.string().optional(),
  trancheNumber: z.string().optional(),
  trancheSequence: z.number().optional(),
  transactionDate: z.date().optional(),
  settlementDate: z.date().optional(),
  reference: z.string().optional(),
  description: z.string().optional(),
  certificateNumber: z.string().optional(),
  documentPath: z.string().optional(),
  status: z.string().default('Pending'),
});

const transactionUpdateSchema = transactionInputSchema.partial().extend({
  id: z.string(),
});

export const transactionsRouter = createTRPCRouter({
  // Get all transactions for an entity
  getByEntityId: publicProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      try {
        const transactions = await prisma.transaction.findMany({
          where: { entityId: input.entityId },
          include: {
            entity: true,
            fromMember: true,
            toMember: true,
            securityClass: true,
          },
          orderBy: {
            transactionDate: 'desc',
          },
        });

        return {
          success: true,
          data: transactions,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch transactions',
          cause: error,
        });
      }
    }),

  // Get transaction by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const transaction = await prisma.transaction.findUnique({
          where: { id: input.id },
          include: {
            entity: true,
            fromMember: true,
            toMember: true,
            securityClass: true,
          },
        });

        if (!transaction) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          });
        }

        return {
          success: true,
          data: transaction,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch transaction',
          cause: error,
        });
      }
    }),

  // Create transaction
  create: publicProcedure
    .input(transactionInputSchema)
    .mutation(async ({ input }) => {
      try {
        const transaction = await prisma.transaction.create({
          data: {
            entityId: input.entityId,
            securityClassId: input.securityClassId,
            transactionType: input.transactionType,
            reasonCode: input.reasonCode,
            quantity: input.quantity,
            amountPaidPerSecurity: input.amountPaidPerSecurity || null,
            amountUnpaidPerSecurity: input.amountUnpaidPerSecurity || null,
            transferPricePerSecurity: input.transferPricePerSecurity || null,
            currency: input.currency,
            fromMemberId: input.fromMemberId || null,
            toMemberId: input.toMemberId || null,
            trancheNumber: input.trancheNumber || null,
            trancheSequence: input.trancheSequence || null,
            transactionDate: input.transactionDate || new Date(),
            settlementDate: input.settlementDate || null,
            reference: input.reference || null,
            description: input.description || null,
            certificateNumber: input.certificateNumber || null,
            documentPath: input.documentPath || null,
            status: input.status,
          },
        });

        return {
          success: true,
          data: transaction,
          message: 'Transaction created successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create transaction',
          cause: error,
        });
      }
    }),

  // Update transaction
  update: publicProcedure
    .input(transactionUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;

        const transaction = await prisma.transaction.update({
          where: { id },
          data: updateData,
        });

        return {
          success: true,
          data: transaction,
          message: 'Transaction updated successfully',
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Record to update not found')
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update transaction',
          cause: error,
        });
      }
    }),

  // Delete transaction
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await prisma.transaction.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: 'Transaction deleted successfully',
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Record to delete does not exist')
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete transaction',
          cause: error,
        });
      }
    }),
});
