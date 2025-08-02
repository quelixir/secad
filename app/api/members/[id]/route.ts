import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiResponse, MemberInput, MemberType } from "@/lib/types";
import { getDefaultCountry } from "@/lib/config";

// GET /api/members/[id] - Get a specific member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeTransactions = searchParams
      .get("include")
      ?.includes("transactions");

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        entity: true,
        transactionsFrom: includeTransactions
          ? {
              include: {
                toMember: true,
                securityClass: true,
              },
              orderBy: {
                settlementDate: "desc",
              },
            }
          : false,
        transactionsTo: includeTransactions
          ? {
              include: {
                fromMember: true,
                securityClass: true,
              },
              orderBy: {
                settlementDate: "desc",
              },
            }
          : false,
      },
    });

    if (!member) {
      const response: ApiResponse = {
        success: false,
        error: "Member not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: member,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching member:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to fetch member",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/members/[id] - Update a member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: Partial<MemberInput> = await request.json();

    // Check if member exists
    const existingMember = await prisma.member.findUnique({
      where: { id },
    });

    if (!existingMember) {
      const response: ApiResponse = {
        success: false,
        error: "Member not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check for duplicate member number if being updated and within same entity
    if (
      body.memberNumber &&
      body.memberNumber !== existingMember.memberNumber
    ) {
      const duplicate = await prisma.member.findFirst({
        where: {
          entityId: existingMember.entityId,
          memberNumber: body.memberNumber,
          id: { not: id },
        },
      });

      if (duplicate) {
        const response: ApiResponse = {
          success: false,
          error: "Member number already exists for this entity",
        };
        return NextResponse.json(response, { status: 409 });
      }
    }

    // Validate member type specific fields if being updated
    if (body.memberType) {
      if (
        body.memberType === MemberType.INDIVIDUAL &&
        (!body.givenNames || !body.familyName)
      ) {
        const response: ApiResponse = {
          success: false,
          error:
            "Given names and family name are required for individual members",
        };
        return NextResponse.json(response, { status: 400 });
      }

      if (
        body.memberType === "Joint" &&
        (!body.jointPersons || body.jointPersons.length < 2)
      ) {
        const response: ApiResponse = {
          success: false,
          error: "For joint members, at least 2 persons are required",
        };
        return NextResponse.json(response, { status: 400 });
      }

      if (
        body.memberType !== MemberType.INDIVIDUAL &&
        body.memberType !== MemberType.JOINT &&
        !body.entityName
      ) {
        const response: ApiResponse = {
          success: false,
          error: "Entity name is required for non-individual members",
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Build update data object
    const updateData: any = {};
    if (body.givenNames !== undefined)
      updateData.givenNames = body.givenNames || null;
    if (body.familyName !== undefined)
      updateData.familyName = body.familyName || null;
    if (body.entityName !== undefined)
      updateData.entityName = body.entityName || null;
    if (body.memberType) updateData.memberType = body.memberType;
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.address !== undefined) updateData.address = body.address || null;
    if (body.city !== undefined) updateData.city = body.city || null;
    if (body.state !== undefined) updateData.state = body.state || null;
    if (body.postcode !== undefined)
      updateData.postcode = body.postcode || null;
    if (body.country !== undefined)
      updateData.country = body.country || getDefaultCountry();
    if (body.memberNumber !== undefined)
      updateData.memberNumber = body.memberNumber || null;
    if (body.designation !== undefined)
      updateData.designation = body.designation || null;
    if (body.tfn !== undefined) updateData.tfn = body.tfn || null;
    if (body.abn !== undefined) updateData.abn = body.abn || null;

    const member = await prisma.member.update({
      where: { id },
      data: updateData,
      include: {
        entity: true,
      },
    });

    const response: ApiResponse = {
      success: true,
      data: member,
      message: "Member updated successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating member:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to update member",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/members/[id] - Delete a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check if member exists and get transaction counts
    const existingMember = await prisma.member.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactionsFrom: true,
            transactionsTo: true,
          },
        },
      },
    });

    if (!existingMember) {
      const response: ApiResponse = {
        success: false,
        error: "Member not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check if member has transactions
    if (
      existingMember._count.transactionsFrom > 0 ||
      existingMember._count.transactionsTo > 0
    ) {
      const response: ApiResponse = {
        success: false,
        error: "Cannot delete member with existing transactions",
      };
      return NextResponse.json(response, { status: 409 });
    }

    await prisma.member.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: "Member deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error deleting member:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to delete member",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
