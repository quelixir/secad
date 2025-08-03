import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DocumentService } from "@/lib/services/document-service";
import { prisma } from "@/lib/db";
import { z } from "zod";

const documentService = new DocumentService();

// POST /api/documents/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const createFolderSchema = z.object({
      entityId: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      parentId: z.string().optional(),
    });

    const validatedData = createFolderSchema.parse(body);

    // Check entity access (Admin/Editor only)
    const access = await prisma.userEntityAccess.findFirst({
      where: {
        userId: session.user.id,
        entityId: validatedData.entityId,
        role: {
          in: ["Admin", "Editor"],
        },
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: "Insufficient permissions for this entity" },
        { status: 403 }
      );
    }

    // Create folder
    const folder = await documentService.createFolder({
      ...validatedData,
      createdBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: folder,
    });

  } catch (error) {
    console.error("Folder creation error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("already exists")) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/documents/folders - List folders for an entity
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");
    const parentId = searchParams.get("parentId") || undefined;

    if (!entityId) {
      return NextResponse.json(
        { error: "Entity ID is required" },
        { status: 400 }
      );
    }

    // Check entity access
    const access = await prisma.userEntityAccess.findFirst({
      where: {
        userId: session.user.id,
        entityId,
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: "Insufficient permissions for this entity" },
        { status: 403 }
      );
    }

    const folders = await documentService.getFolders(entityId, parentId);

    return NextResponse.json({
      success: true,
      data: folders,
    });

  } catch (error) {
    console.error("Folder listing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}