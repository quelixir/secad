import { z } from 'zod';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/lib/trpc';
import { prisma } from '@/lib/db';
import { TRPCError } from '@trpc/server';

const securityClassInputSchema = z.object({
  entityId: z.string(),
  name: z.string().min(1, 'Name is required'),
  symbol: z.string().optional(),
  description: z.string().optional(),
  votingRights: z.boolean().default(false),
  dividendRights: z.boolean().default(false),
});

const securityClassUpdateSchema = securityClassInputSchema.partial().extend({
  id: z.string(),
});

export const securitiesRouter = createTRPCRouter({
  // Get all securities for an entity
  getByEntityId: protectedProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }
      const access = await prisma.userEntityAccess.findUnique({
        where: {
          userId_entityId: { userId: ctx.user.id, entityId: input.entityId },
        },
      });
      if (!access) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'No access to this entity',
        });
      }
      try {
        const securities = await prisma.securityClass.findMany({
          where: { entityId: input.entityId },
          include: {
            entity: true,
            transactions: true,
            _count: {
              select: {
                transactions: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });

        return {
          success: true,
          data: securities,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch securities',
          cause: error,
        });
      }
    }),

  // Get security by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const security = await prisma.securityClass.findUnique({
          where: { id: input.id },
          include: {
            entity: true,
            transactions: {
              include: {
                fromMember: true,
                toMember: true,
              },
            },
            _count: {
              select: {
                transactions: true,
              },
            },
          },
        });

        if (!security) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Security class not found',
          });
        }

        return {
          success: true,
          data: security,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch security class',
          cause: error,
        });
      }
    }),

  // Create security class
  create: protectedProcedure
    .input(securityClassInputSchema)
    .mutation(async ({ input }) => {
      try {
        const security = await prisma.securityClass.create({
          data: {
            entityId: input.entityId,
            name: input.name,
            symbol: input.symbol || null,
            description: input.description || null,
            votingRights: input.votingRights,
            dividendRights: input.dividendRights,
          },
        });

        return {
          success: true,
          data: security,
          message: 'Security class created successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create security class',
          cause: error,
        });
      }
    }),

  // Update security class
  update: protectedProcedure
    .input(securityClassUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;

        const security = await prisma.securityClass.update({
          where: { id },
          data: updateData,
        });

        return {
          success: true,
          data: security,
          message: 'Security class updated successfully',
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Record to update not found')
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Security class not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update security class',
          cause: error,
        });
      }
    }),

  // Delete security class
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await prisma.securityClass.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: 'Security class deleted successfully',
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Record to delete does not exist')
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Security class not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete security class',
          cause: error,
        });
      }
    }),
});
