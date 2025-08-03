import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/lib/trpc";
import { prisma } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { getDefaultCurrencyCode } from "@/lib/config";

const transactionInputSchema = z.object({
  entityId: z.string(),
  securityClassId: z.string(),
  transactionType: z.string().min(1, "Transaction type is required"),
  reasonCode: z.string().min(1, "Reason code is required"),
  quantity: z.number().positive("Quantity must be positive"),
  amountPaidPerSecurity: z.number().optional(),
  amountUnpaidPerSecurity: z.number().optional(),
  currencyCode: z.string().default(getDefaultCurrencyCode()),
  fromMemberId: z.string().optional(),
  toMemberId: z.string().optional(),
  trancheNumber: z.string().optional(),
  trancheSequence: z.number().optional(),
  postedDate: z.date().optional(),
  settlementDate: z.date().optional(),
  reference: z.string().optional(),
  description: z.string().optional(),
  certificateNumber: z.string().optional(),
  status: z.string().default("Pending"),
});

const transactionUpdateSchema = transactionInputSchema.partial().extend({
  id: z.string(),
});

export const transactionsRouter = createTRPCRouter({
  // Get all transactions for an entity
  getByEntityId: protectedProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }
      const access = await prisma.userEntityAccess.findUnique({
        where: {
          userId_entityId: { userId: ctx.user.id, entityId: input.entityId },
        },
      });
      if (!access) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "No access to this entity",
        });
      }
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
            settlementDate: "desc",
          },
        });

        return {
          success: true,
          data: transactions,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch transactions",
          cause: error,
        });
      }
    }),

  // Get transaction by ID
  getById: protectedProcedure
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
            code: "NOT_FOUND",
            message: "Transaction not found",
          });
        }

        return {
          success: true,
          data: transaction,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch transaction",
          cause: error,
        });
      }
    }),

  // Create transaction
  create: protectedProcedure
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
            currencyCode: input.currencyCode || null,
            fromMemberId: input.fromMemberId || null,
            toMemberId: input.toMemberId || null,
            trancheNumber: input.trancheNumber || null,
            trancheSequence: input.trancheSequence || null,
            postedDate: input.postedDate || new Date(),
            settlementDate: input.settlementDate || new Date(),
            reference: input.reference || null,
            description: input.description || null,
            certificateData: input.certificateNumber
              ? { certificateNumber: input.certificateNumber }
              : undefined,
            status: input.status,
          },
        });

        return {
          success: true,
          data: transaction,
          message: "Transaction created successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create transaction",
          cause: error,
        });
      }
    }),

  // Update transaction
  update: protectedProcedure
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
          message: "Transaction updated successfully",
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("Record to update not found")
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Transaction not found",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update transaction",
          cause: error,
        });
      }
    }),

  // Delete transaction
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await prisma.transaction.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: "Transaction deleted successfully",
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("Record to delete does not exist")
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Transaction not found",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete transaction",
          cause: error,
        });
      }
    }),
});
