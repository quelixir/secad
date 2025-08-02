import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc";
import { prisma } from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";

const createInvitationSchema = z.object({
  entityId: z.string(),
  email: z.string().email(),
  role: z.enum(["Admin", "Editor", "Viewer"]),
});

const acceptInvitationSchema = z.object({
  token: z.string(),
});

export const invitationsRouter = createTRPCRouter({
  // List invitations for an entity
  list: protectedProcedure
    .input(z.object({ entityId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }
      // Only allow if user has access to the entity
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
      return prisma.invitation.findMany({
        where: { entityId: input.entityId },
        orderBy: { createdAt: "desc" },
      });
    }),

  // Create invitation
  create: protectedProcedure
    .input(createInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }
      // Only allow if user has Admin access to the entity
      const access = await prisma.userEntityAccess.findUnique({
        where: {
          userId_entityId: { userId: ctx.user.id, entityId: input.entityId },
        },
      });
      if (!access || access.role !== "Admin") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only Admins can invite collaborators",
        });
      }
      // Generate a unique token
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
      return prisma.invitation.create({
        data: {
          entityId: input.entityId,
          email: input.email,
          role: input.role,
          invitedBy: ctx.user.id,
          token,
          expiresAt,
        },
      });
    }),

  // Accept invitation
  accept: protectedProcedure
    .input(acceptInvitationSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user?.id || !ctx.user.email) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }
      const invitation = await prisma.invitation.findUnique({
        where: { token: input.token },
      });
      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }
      if (invitation.accepted) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation already accepted",
        });
      }
      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation expired",
        });
      }
      // Only allow if the logged-in user's email matches the invitation
      if (ctx.user.email !== invitation.email) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "This invitation is not for your email",
        });
      }
      // Grant access
      await prisma.userEntityAccess.create({
        data: {
          userId: ctx.user.id,
          entityId: invitation.entityId,
          role: invitation.role,
          invitedBy: invitation.invitedBy,
        },
      });
      await prisma.invitation.update({
        where: { token: input.token },
        data: { accepted: true, acceptedAt: new Date() },
      });
      return { success: true };
    }),
});
