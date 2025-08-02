import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiResponse, AssociateInput } from "@/lib/types";
import { getDefaultCountry } from "@/lib/config";

// GET /api/associates - List all associates (optionally filtered by entity)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");
    const includeHistorical = searchParams.get("includeHistorical") === "true";
    const type = searchParams.get("type"); // Filter by associate type

    const whereClause: any = {};
    if (entityId) whereClause.entityId = entityId;
    if (type) {
      // Handle multiple types passed as comma-separated string
      const types = type.split(",").map((t) => t.trim());
      whereClause.type = { in: types };
    }
    if (!includeHistorical) {
      whereClause.status = "Active";
    }

    const associates = await prisma.associate.findMany({
      where: whereClause,
      include: {
        entity: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ entity: { name: "asc" } }, { appointmentDate: "desc" }],
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: associates,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching associates:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to fetch associates",
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/associates - Create a new associate
export async function POST(request: NextRequest) {
  try {
    const body: AssociateInput = await request.json();

    // Validate required fields
    if (!body.entityId || !body.type) {
      const response: ApiResponse = {
        success: false,
        error: "Entity and associate type are required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate individual vs corporate fields
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

    // Automatically set status based on resignation date
    const status = body.resignationDate ? "Resigned" : "Active";

    const associate = await prisma.associate.create({
      data: {
        entityId: body.entityId,
        type: body.type,
        isIndividual: body.isIndividual,
        givenNames: body.givenNames || null,
        familyName: body.familyName || null,
        dateOfBirth: body.dateOfBirth || null,
        previousNames: body.previousNames || [],
        entityName: body.entityName || null,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        postcode: body.postcode || null,
        country: body.country || getDefaultCountry(),
        status: status,
        appointmentDate: body.appointmentDate || new Date(),
        resignationDate: body.resignationDate || null,
        notes: body.notes || null,
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
      message: "Associate created successfully",
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating associate:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to create associate",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
