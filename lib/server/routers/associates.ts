import { z } from 'zod';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/lib/trpc';
import { prisma } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { getDefaultCountry } from '@/lib/config';

const associateInputSchema = z.object({
  entityId: z.string(),
  type: z.string().min(1, 'Type is required'),
  isIndividual: z.boolean(),
  givenNames: z.string().optional(),
  familyName: z.string().optional(),
  dateOfBirth: z.date().optional(),
  previousNames: z.array(z.string()).optional(),
  entityName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().default(getDefaultCountry()),
  appointmentDate: z.date().optional(),
  resignationDate: z.date().optional(),
  notes: z.string().optional(),
});

const associateUpdateSchema = associateInputSchema.partial().extend({
  id: z.string(),
});

export const associatesRouter = createTRPCRouter({
  // Get all associates for an entity
  getByEntityId: protectedProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ input }) => {
      try {
        const associates = await prisma.associate.findMany({
          where: { entityId: input.entityId },
          include: {
            entity: true,
          },
          orderBy: [
            { familyName: 'asc' },
            { givenNames: 'asc' },
            { entityName: 'asc' },
          ],
        });

        return {
          success: true,
          data: associates,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch associates',
          cause: error,
        });
      }
    }),

  // Get associate by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const associate = await prisma.associate.findUnique({
          where: { id: input.id },
          include: {
            entity: true,
          },
        });

        if (!associate) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Associate not found',
          });
        }

        return {
          success: true,
          data: associate,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch associate',
          cause: error,
        });
      }
    }),

  // Create associate
  create: protectedProcedure
    .input(associateInputSchema)
    .mutation(async ({ input }) => {
      try {
        const associate = await prisma.associate.create({
          data: {
            entityId: input.entityId,
            type: input.type,
            isIndividual: input.isIndividual,
            givenNames: input.givenNames || null,
            familyName: input.familyName || null,
            dateOfBirth: input.dateOfBirth || undefined,
            previousNames: input.previousNames || [],
            entityName: input.entityName || null,
            email: input.email || null,
            phone: input.phone || null,
            address: input.address || null,
            city: input.city || null,
            state: input.state || null,
            postcode: input.postcode || null,
            country: input.country,
            appointmentDate: input.appointmentDate || undefined,
            resignationDate: input.resignationDate || undefined,
            notes: input.notes || null,
          },
        });

        return {
          success: true,
          data: associate,
          message: 'Associate created successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create associate',
          cause: error,
        });
      }
    }),

  // Update associate
  update: protectedProcedure
    .input(associateUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;

        const associate = await prisma.associate.update({
          where: { id },
          data: updateData,
        });

        return {
          success: true,
          data: associate,
          message: 'Associate updated successfully',
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Record to update not found')
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Associate not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update associate',
          cause: error,
        });
      }
    }),

  // Delete associate
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await prisma.associate.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: 'Associate deleted successfully',
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Record to delete does not exist')
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Associate not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete associate',
          cause: error,
        });
      }
    }),
});
