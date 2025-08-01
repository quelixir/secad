import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/lib/trpc";
import { prisma } from "@/lib/db";
import { TRPCError } from "@trpc/server";

export const registryRouter = createTRPCRouter({
  // Get registry summary for an entity
  getSummary: protectedProcedure
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
        const [entity, members, securities, transactions, associates] =
          await Promise.all([
            prisma.entity.findUnique({
              where: { id: input.entityId },
              include: {
                _count: {
                  select: {
                    members: true,
                    securityClasses: true,
                    transactions: true,
                    associates: true,
                    resolutions: true,
                  },
                },
              },
            }),
            prisma.member.findMany({
              where: { entityId: input.entityId },
              select: { id: true, memberType: true, status: true },
            }),
            prisma.securityClass.findMany({
              where: { entityId: input.entityId },
              select: { id: true, name: true, symbol: true },
            }),
            prisma.transaction.findMany({
              where: { entityId: input.entityId },
              select: {
                id: true,
                transactionType: true,
                quantity: true,
                postedDate: true,
                status: true,
              },
              orderBy: { settlementDate: "desc" },
              take: 10,
            }),
            prisma.associate.findMany({
              where: { entityId: input.entityId },
              select: { id: true, type: true, isIndividual: true },
            }),
          ]);

        if (!entity) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Entity not found",
          });
        }

        // Calculate totals
        const totalSecurities = securities.reduce(
          (sum, sec) => sum + (sec.symbol ? 1 : 0),
          0,
        );
        const totalTransactions = transactions.length;
        const totalMembers = members.length;
        const totalAssociates = associates.length;

        // Calculate transaction totals by type
        const transactionTotals = transactions.reduce(
          (acc, txn) => {
            acc[txn.transactionType] =
              (acc[txn.transactionType] || 0) + txn.quantity;
            return acc;
          },
          {} as Record<string, number>,
        );

        return {
          success: true,
          data: {
            entity,
            summary: {
              totalMembers,
              totalSecurities,
              totalTransactions,
              totalAssociates,
              transactionTotals,
              recentTransactions: transactions,
            },
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch registry summary",
          cause: error,
        });
      }
    }),

  // Get registry securities with transaction history
  getSecurities: protectedProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      try {
        const securities = await prisma.securityClass.findMany({
          where: { entityId: input.entityId },
          include: {
            transactions: {
              include: {
                fromMember: true,
                toMember: true,
              },
              orderBy: {
                settlementDate: "desc",
              },
            },
            _count: {
              select: {
                transactions: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        });

        return {
          success: true,
          data: securities,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch registry securities",
          cause: error,
        });
      }
    }),

  // Get registry members with holdings
  getMembers: protectedProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      try {
        const members = await prisma.member.findMany({
          where: { entityId: input.entityId },
          include: {
            transactionsFrom: {
              include: {
                securityClass: true,
              },
            },
            transactionsTo: {
              include: {
                securityClass: true,
              },
            },
          },
          orderBy: [
            { familyName: "asc" },
            { givenNames: "asc" },
            { entityName: "asc" },
          ],
        });

        // Calculate holdings for each member
        const membersWithHoldings = members.map((member) => {
          const holdings: Record<string, number> = {};

          // Process transactions where member is the recipient
          member.transactionsTo.forEach((txn) => {
            const securityId = txn.securityClassId;
            const securityName = txn.securityClass.name;
            const key = `${securityName} (${securityId})`;

            if (
              txn.transactionType === "ISSUE" ||
              txn.transactionType === "TRANSFER"
            ) {
              holdings[key] = (holdings[key] || 0) + txn.quantity;
            } else if (
              txn.transactionType === "CANCELLATION" ||
              txn.transactionType === "REDEMPTION"
            ) {
              holdings[key] = (holdings[key] || 0) - txn.quantity;
            }
          });

          // Process transactions where member is the sender (transfers out)
          member.transactionsFrom.forEach((txn) => {
            const securityId = txn.securityClassId;
            const securityName = txn.securityClass.name;
            const key = `${securityName} (${securityId})`;

            if (txn.transactionType === "TRANSFER") {
              holdings[key] = (holdings[key] || 0) - txn.quantity;
            }
          });

          return {
            ...member,
            holdings,
          };
        });

        return {
          success: true,
          data: membersWithHoldings,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch registry members",
          cause: error,
        });
      }
    }),

  // Get registry transactions
  getTransactions: protectedProcedure
    .input(
      z.object({
        entityId: z.string(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      }),
    )
    .query(async ({ input }) => {
      try {
        const transactions = await prisma.transaction.findMany({
          where: { entityId: input.entityId },
          include: {
            fromMember: true,
            toMember: true,
            securityClass: true,
          },
          orderBy: {
            settlementDate: "desc",
          },
          take: input.limit,
          skip: input.offset,
        });

        const total = await prisma.transaction.count({
          where: { entityId: input.entityId },
        });

        return {
          success: true,
          data: {
            transactions,
            total,
            hasMore: input.offset + input.limit < total,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch registry transactions",
          cause: error,
        });
      }
    }),
});
