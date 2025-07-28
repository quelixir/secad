import { z } from 'zod';
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from '@/lib/trpc';
import { prisma } from '@/lib/db';
import { TRPCError } from '@trpc/server';
import { compliancePackRegistration } from '@/lib/compliance';
import type { inferAsyncReturnType } from '@trpc/server';
import type { createTRPCContext } from '@/lib/trpc';
import { getDefaultCountry } from '@/lib/config';

type Context = inferAsyncReturnType<typeof createTRPCContext>;

const entityIdentifierSchema = z.object({
  type: z.string().min(1, 'Identifier type is required'),
  value: z.string().min(1, 'Identifier value is required'),
  country: z.string().min(1, 'Country is required'),
});

const createEntitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  entityTypeId: z.string().min(1, 'Entity type is required'),
  incorporationDate: z.string().optional(),
  incorporationCountry: z.string().default(getDefaultCountry()),
  incorporationState: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  identifiers: z.array(entityIdentifierSchema).optional().default([]),
});

const updateEntitySchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  entityTypeId: z.string().optional(),
  incorporationDate: z.string().optional(),
  incorporationCountry: z.string().optional(),
  incorporationState: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  identifiers: z.array(entityIdentifierSchema).optional().default([]),
});

type CreateEntityInput = z.infer<typeof createEntitySchema>;
type UpdateEntityInput = z.infer<typeof updateEntitySchema>;

export const entitiesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }
    return await prisma.entity.findMany({
      where: {
        userEntityAccess: {
          some: { userId: ctx.user.id },
        },
      },
      include: {
        identifiers: true,
      },
    });
  }),

  // Get all entities
  getAll: protectedProcedure
    .input(
      z
        .object({
          include: z.enum(['details', 'basic']).default('basic'),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }
      try {
        const entities = await prisma.entity.findMany({
          where: {
            userEntityAccess: {
              some: { userId: ctx.user.id },
            },
          },
          include:
            input?.include === 'details'
              ? {
                  identifiers: true,
                  _count: {
                    select: {
                      members: true,
                      securityClasses: true,
                      transactions: true,
                      associates: true,
                    },
                  },
                }
              : {
                  identifiers: true,
                },
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
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const entity = await prisma.entity.findUnique({
          where: { id: input.id },
          include: {
            identifiers: true,
            members: true,
            securityClasses: true,
            transactions: true,
            associates: true,
            userEntityAccess: {
              include: {
                user: true,
              },
            },
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
  create: protectedProcedure
    .input(createEntitySchema)
    .mutation(
      async ({
        ctx,
        input: entityData,
      }: {
        ctx: Context;
        input: CreateEntityInput;
      }) => {
        const entityType = compliancePackRegistration.getEntityType(
          entityData.incorporationCountry || getDefaultCountry(),
          entityData.entityTypeId
        );

        if (!entityType) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid entity type',
          });
        }

        const { identifiers = [], ...entityDataWithoutIdentifiers } =
          entityData;

        // Create entity and grant Admin access to creator
        return await prisma.$transaction(async (tx) => {
          const entity = await tx.entity.create({
            data: {
              ...entityDataWithoutIdentifiers,
              status: 'Active',
              identifiers: {
                create: identifiers.map((identifier) => ({
                  type: identifier.type,
                  value: identifier.value,
                  country: identifier.country,
                  isActive: true,
                })),
              },
            },
            include: {
              identifiers: true,
            },
          });

          // Grant Admin access to creator
          if (!ctx.user?.id) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'User not authenticated',
            });
          }
          await tx.userEntityAccess.create({
            data: {
              userId: ctx.user.id,
              entityId: entity.id,
              role: 'Admin',
            },
          });

          // Create default entity settings with certificates enabled
          await tx.entitySettings.create({
            data: {
              entityId: entity.id,
              certificatesEnabled: true,
              certificateSettings: {},
            },
          });

          return entity;
        });
      }
    ),

  // Update entity
  update: protectedProcedure
    .input(updateEntitySchema)
    .mutation(
      async ({
        ctx,
        input: updateData,
      }: {
        ctx: Context;
        input: UpdateEntityInput;
      }) => {
        if (updateData.entityTypeId !== undefined) {
          const entityType = compliancePackRegistration.getEntityType(
            updateData.incorporationCountry || getDefaultCountry(),
            updateData.entityTypeId
          );

          if (!entityType) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid entity type',
            });
          }
        }

        const {
          id,
          identifiers = [],
          ...updateDataWithoutIdentifiers
        } = updateData;

        return await prisma.entity.update({
          where: { id },
          data: {
            ...updateDataWithoutIdentifiers,
            identifiers: {
              deleteMany: {},
              create: identifiers.map((identifier) => ({
                type: identifier.type,
                value: identifier.value,
                country: identifier.country,
                isActive: true,
              })),
            },
          },
          include: {
            identifiers: true,
          },
        });
      }
    ),

  // Delete entity
  delete: protectedProcedure
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
