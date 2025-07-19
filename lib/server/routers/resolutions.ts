import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/lib/trpc';
import { prisma } from '@/lib/db';
import { TRPCError } from '@trpc/server';

const resolutionInputSchema = z.object({
  entityId: z.string(),
  title: z.string().min(1, 'Title is required'),
  type: z.string().min(1, 'Type is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  status: z.string().default('Draft'),
  resolutionDate: z.date().optional(),
  effectiveDate: z.date().optional(),
  approvedBy: z.string().optional(),
  votingDetails: z.string().optional(),
  referenceNumber: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  relatedPersonId: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
});

const resolutionUpdateSchema = resolutionInputSchema.partial().extend({
  id: z.string(),
});

export const resolutionsRouter = createTRPCRouter({
  // Get all resolutions for an entity
  getByEntityId: publicProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      try {
        const resolutions = await prisma.resolution.findMany({
          where: { entityId: input.entityId },
          include: {
            entity: true,
          },
          orderBy: {
            resolutionDate: 'desc',
          },
        });

        return {
          success: true,
          data: resolutions,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch resolutions',
          cause: error,
        });
      }
    }),

  // Get resolution by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const resolution = await prisma.resolution.findUnique({
          where: { id: input.id },
          include: {
            entity: true,
          },
        });

        if (!resolution) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Resolution not found',
          });
        }

        return {
          success: true,
          data: resolution,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch resolution',
          cause: error,
        });
      }
    }),

  // Create resolution
  create: publicProcedure
    .input(resolutionInputSchema)
    .mutation(async ({ input }) => {
      try {
        const resolution = await prisma.resolution.create({
          data: {
            entityId: input.entityId,
            title: input.title,
            type: input.type,
            category: input.category,
            description: input.description || null,
            content: input.content,
            status: input.status,
            resolutionDate: input.resolutionDate || undefined,
            effectiveDate: input.effectiveDate || undefined,
            approvedBy: input.approvedBy || null,
            votingDetails: input.votingDetails || null,
            referenceNumber: input.referenceNumber || null,
            attachments: input.attachments || [],
            relatedPersonId: input.relatedPersonId || null,
            notes: input.notes || null,
            createdBy: input.createdBy || null,
          },
        });

        return {
          success: true,
          data: resolution,
          message: 'Resolution created successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create resolution',
          cause: error,
        });
      }
    }),

  // Update resolution
  update: publicProcedure
    .input(resolutionUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;

        const resolution = await prisma.resolution.update({
          where: { id },
          data: updateData,
        });

        return {
          success: true,
          data: resolution,
          message: 'Resolution updated successfully',
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Record to update not found')
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Resolution not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update resolution',
          cause: error,
        });
      }
    }),

  // Delete resolution
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await prisma.resolution.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: 'Resolution deleted successfully',
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Record to delete does not exist')
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Resolution not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete resolution',
          cause: error,
        });
      }
    }),
});
