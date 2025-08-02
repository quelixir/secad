import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiResponse, AssociateInput } from "@/lib/types";

// GET /api/associates/[id] - Get a specific associate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const associate = await prisma.associate.findUnique({
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

    if (!associate) {
      const response: ApiResponse = {
        success: false,
        error: "Associate not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<any> = {
      success: true,
      data: associate,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching associate:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to fetch associate",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/associates/[id] - Update a specific associate
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: Partial<AssociateInput> & {
      status?: string;
      resignationDate?: Date;
    } = await request.json();

    // Check if associate exists
    const existingAssociate = await prisma.associate.findUnique({
      where: { id },
    });

    if (!existingAssociate) {
      const response: ApiResponse = {
        success: false,
        error: "Associate not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Validate individual vs corporate fields if type is being changed
    if (body.isIndividual !== undefined) {
      if (body.isIndividual) {
        if (!body.givenNames || !body.familyName) {
          const response: ApiResponse = {
            success: false,
            error:
              "Given names and family name are required for individual associates",
          };
          return NextResponse.json(response, { status: 400 });
        }
      } else {
        if (!body.entityName) {
          const response: ApiResponse = {
            success: false,
            error: "Entity name is required for corporate associates",
          };
          return NextResponse.json(response, { status: 400 });
        }
      }
    }

    // Automatically set status based on resignation date if not explicitly provided
    let statusToSet = body.status;
    if (!statusToSet && body.resignationDate !== undefined) {
      statusToSet = body.resignationDate ? "Resigned" : "Active";
    }

    const associate = await prisma.associate.update({
      where: { id },
      data: {
        ...(body.type && { type: body.type }),
        ...(body.isIndividual !== undefined && {
          isIndividual: body.isIndividual,
        }),
        ...(body.givenNames !== undefined && { givenNames: body.givenNames }),
        ...(body.familyName !== undefined && { familyName: body.familyName }),
        ...(body.dateOfBirth !== undefined && {
          dateOfBirth: body.dateOfBirth,
        }),
        ...(body.previousNames !== undefined && {
          previousNames: body.previousNames,
        }),
        ...(body.entityName !== undefined && { entityName: body.entityName }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.postcode !== undefined && { postcode: body.postcode }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.appointmentDate && { appointmentDate: body.appointmentDate }),
        ...(body.resignationDate !== undefined && {
          resignationDate: body.resignationDate,
        }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(statusToSet && { status: statusToSet }),
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
      data: associate,
      message: "Associate updated successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating associate:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to update associate",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/associates/[id] - Delete a specific associate
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check if associate exists
    const existingAssociate = await prisma.associate.findUnique({
      where: { id },
    });

    if (!existingAssociate) {
      const response: ApiResponse = {
        success: false,
        error: "Associate not found",
      };
      return NextResponse.json(response, { status: 404 });
    }

    await prisma.associate.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: "Associate deleted successfully",
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error deleting associate:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to delete associate",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
