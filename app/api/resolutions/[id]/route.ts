import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiResponse, ResolutionInput } from "@/lib/types";

// GET /api/resolutions/[id] - Get a specific resolution
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const resolution = await prisma.resolution.findUnique({
      where: { id },
      include: {
        entity: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!resolution) {
      const response: ApiResponse = {
        success: false,
        error: "Resolution not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: resolution,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error fetching resolution:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to fetch resolution",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/resolutions/[id] - Update a resolution
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Partial<ResolutionInput> = await request.json();

    // Check if resolution exists
    const existingResolution = await prisma.resolution.findUnique({
      where: { id },
    });

    if (!existingResolution) {
      const response: ApiResponse = {
        success: false,
        error: "Resolution not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const resolution = await prisma.resolution.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.type && { type: body.type }),
        ...(body.category && { category: body.category }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
        ...(body.content && { content: body.content }),
        ...(body.status && { status: body.status }),
        ...(body.resolutionDate !== undefined && {
          resolutionDate: body.resolutionDate,
        }),
        ...(body.effectiveDate !== undefined && {
          effectiveDate: body.effectiveDate,
        }),
        ...(body.approvedBy !== undefined && { approvedBy: body.approvedBy }),
        ...(body.votingDetails !== undefined && {
          votingDetails: body.votingDetails,
        }),
        ...(body.referenceNumber !== undefined && {
          referenceNumber: body.referenceNumber,
        }),
        ...(body.attachments !== undefined && {
          attachments: body.attachments,
        }),
        ...(body.relatedPersonId !== undefined && {
          relatedPersonId: body.relatedPersonId,
        }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
      include: {
        entity: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const response: ApiResponse<any> = {
      success: true,
      data: resolution,
      message: "Resolution updated successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error updating resolution:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to update resolution",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/resolutions/[id] - Delete a resolution
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if resolution exists
    const existingResolution = await prisma.resolution.findUnique({
      where: { id },
    });

    if (!existingResolution) {
      const response: ApiResponse = {
        success: false,
        error: "Resolution not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    await prisma.resolution.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: "Resolution deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error deleting resolution:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to delete resolution",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
