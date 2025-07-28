import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/lib/trpc';
import { prisma } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { getDefaultCountry } from '@/lib/config';

const memberInputSchema = z.object({
  entityId: z.string(),
  givenNames: z.string().optional(),
  familyName: z.string().optional(),
  entityName: z.string().optional(),
  memberType: z.string().min(1, 'Member type is required'),
  designation: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().default(getDefaultCountry()),
  memberNumber: z.string().optional(),
  tfn: z.string().optional(),
  abn: z.string().optional(),
});

const memberUpdateSchema = memberInputSchema.partial().extend({
  id: z.string(),
});

export const membersRouter = createTRPCRouter({
  // Get all members for an entity
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
        const members = await prisma.member.findMany({
          where: { entityId: input.entityId },
          include: {
            entity: true,
            transactionsFrom: {
              include: {
                toMember: true,
                securityClass: true,
              },
            },
            transactionsTo: {
              include: {
                fromMember: true,
                securityClass: true,
              },
            },
          },
          orderBy: [
            { familyName: 'asc' },
            { givenNames: 'asc' },
            { entityName: 'asc' },
          ],
        });

        return {
          success: true,
          data: members,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch members',
          cause: error,
        });
      }
    }),

  // Get member by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const member = await prisma.member.findUnique({
          where: { id: input.id },
          include: {
            entity: true,
            transactionsFrom: {
              include: {
                toMember: true,
                securityClass: true,
              },
            },
            transactionsTo: {
              include: {
                fromMember: true,
                securityClass: true,
              },
            },
          },
        });

        if (!member) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Member not found',
          });
        }

        return {
          success: true,
          data: member,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch member',
          cause: error,
        });
      }
    }),

  // Create member
  create: protectedProcedure
    .input(memberInputSchema)
    .mutation(async ({ input }) => {
      try {
        const member = await prisma.member.create({
          data: {
            entityId: input.entityId,
            givenNames: input.givenNames || null,
            familyName: input.familyName || null,
            entityName: input.entityName || null,
            memberType: input.memberType,
            designation: input.designation || null,
            email: input.email || null,
            phone: input.phone || null,
            address: input.address || null,
            city: input.city || null,
            state: input.state || null,
            postcode: input.postcode || null,
            country: input.country,
            memberNumber: input.memberNumber || null,
            tfn: input.tfn || null,
            abn: input.abn || null,
          },
        });

        return {
          success: true,
          data: member,
          message: 'Member created successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create member',
          cause: error,
        });
      }
    }),

  // Update member
  update: protectedProcedure
    .input(memberUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;

        const member = await prisma.member.update({
          where: { id },
          data: updateData,
        });

        return {
          success: true,
          data: member,
          message: 'Member updated successfully',
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Record to update not found')
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Member not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update member',
          cause: error,
        });
      }
    }),

  // Delete member
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await prisma.member.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: 'Member deleted successfully',
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Record to delete does not exist')
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Member not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete member',
          cause: error,
        });
      }
    }),
});
