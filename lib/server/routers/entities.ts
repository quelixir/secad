import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '@/lib/trpc';
import { prisma } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { validateACN, validateABN } from '@/lib/utils';

const entityInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  abn: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateABN(val),
      'ABN must be a valid 11-digit number with correct check digits'
    ),
  acn: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateACN(val),
      'ACN must be a valid 9-digit number with correct check digit'
    ),
  entityType: z.string().min(1, 'Entity type is required'),
  incorporationDate: z.date().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().default('Australia'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
});

const entityUpdateSchema = entityInputSchema.partial().extend({
  id: z.string(),
});

export const entitiesRouter = createTRPCRouter({
  // Get all entities
  getAll: publicProcedure
    .input(
      z
        .object({
          include: z.enum(['details', 'basic']).default('basic'),
        })
        .optional()
    )
    .query(async ({ input }) => {
      try {
        const entities = await prisma.entity.findMany({
          include:
            input?.include === 'details'
              ? {
                  _count: {
                    select: {
                      members: true,
                      securityClasses: true,
                      transactions: true,
                      associates: true,
                    },
                  },
                }
              : undefined,
          orderBy: {
            name: 'asc',
          },
        });

        return {
          success: true,
          data: entities,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch entities',
          cause: error,
        });
      }
    }),

  // Get entity by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const entity = await prisma.entity.findUnique({
          where: { id: input.id },
          include: {
            members: true,
            securityClasses: true,
            transactions: true,
            associates: true,
            _count: {
              select: {
                members: true,
                securityClasses: true,
                transactions: true,
                associates: true,
              },
            },
          },
        });

        if (!entity) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Entity not found',
          });
        }

        return {
          success: true,
          data: entity,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch entity',
          cause: error,
        });
      }
    }),

  // Create entity
  create: publicProcedure
    .input(entityInputSchema)
    .mutation(async ({ input }) => {
      try {
        // Check for duplicate ABN/ACN if provided
        if (input.abn || input.acn) {
          const existing = await prisma.entity.findFirst({
            where: {
              OR: [
                input.abn ? { abn: input.abn } : {},
                input.acn ? { acn: input.acn } : {},
              ].filter((condition) => Object.keys(condition).length > 0),
            },
          });

          if (existing) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Entity with this ABN or ACN already exists',
            });
          }
        }

        const entity = await prisma.entity.create({
          data: {
            name: input.name,
            abn: input.abn || null,
            acn: input.acn || null,
            entityType: input.entityType,
            incorporationDate: input.incorporationDate || null,
            address: input.address || null,
            city: input.city || null,
            state: input.state || null,
            postcode: input.postcode || null,
            country: input.country,
            email: input.email || null,
            phone: input.phone || null,
            website: input.website || null,
          },
        });

        return {
          success: true,
          data: entity,
          message: 'Entity created successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create entity',
          cause: error,
        });
      }
    }),

  // Update entity
  update: publicProcedure
    .input(entityUpdateSchema)
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;

        // Check for duplicate ABN/ACN if provided
        if (updateData.abn || updateData.acn) {
          const existing = await prisma.entity.findFirst({
            where: {
              id: { not: id },
              OR: [
                updateData.abn ? { abn: updateData.abn } : {},
                updateData.acn ? { acn: updateData.acn } : {},
              ].filter((condition) => Object.keys(condition).length > 0),
            },
          });

          if (existing) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'Entity with this ABN or ACN already exists',
            });
          }
        }

        const entity = await prisma.entity.update({
          where: { id },
          data: updateData,
        });

        return {
          success: true,
          data: entity,
          message: 'Entity updated successfully',
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        if (
          error instanceof Error &&
          error.message.includes('Record to update not found')
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Entity not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update entity',
          cause: error,
        });
      }
    }),

  // Delete entity
  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await prisma.entity.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: 'Entity deleted successfully',
        };
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('Record to delete does not exist')
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Entity not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete entity',
          cause: error,
        });
      }
    }),
});
