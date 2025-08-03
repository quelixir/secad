import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DocumentService } from "@/lib/services/document-service";
import { prisma } from "@/lib/db";
import { z } from "zod";

const documentService = new DocumentService();

// GET /api/documents/folders/[id] - Get a specific folder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const folderId = resolvedParams.id;

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    const folder = await documentService.getFolderById(folderId);

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    // Check entity access
    const access = await prisma.userEntityAccess.findFirst({
      where: {
        userId: session.user.id,
        entityId: folder.entityId,
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: "Insufficient permissions for this entity" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: folder,
    });

  } catch (error) {
    console.error("Folder fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/documents/folders/[id] - Update a folder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const folderId = resolvedParams.id;

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const updateFolderSchema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
    });

    const validatedData = updateFolderSchema.parse(body);

    // Get folder and check access
    const folder = await documentService.getFolderById(folderId);

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    // Check entity access (Admin/Editor only)
    const access = await prisma.userEntityAccess.findFirst({
      where: {
        userId: session.user.id,
        entityId: folder.entityId,
        role: {
          in: ["Admin", "Editor"],
        },
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: "Insufficient permissions to modify this folder" },
        { status: 403 }
      );
    }

    // Update folder
    const updatedFolder = await documentService.updateFolder(
      folderId,
      validatedData
    );

    return NextResponse.json({
      success: true,
      data: updatedFolder,
    });

  } catch (error) {
    console.error("Folder update error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/folders/[id] - Delete a folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const folderId = resolvedParams.id;

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    // Get folder and check access
    const folder = await documentService.getFolderById(folderId);

    if (!folder) {
      return NextResponse.json(
        { error: "Folder not found" },
        { status: 404 }
      );
    }

    // Check entity access (Admin/Editor only)
    const access = await prisma.userEntityAccess.findFirst({
      where: {
        userId: session.user.id,
        entityId: folder.entityId,
        role: {
          in: ["Admin", "Editor"],
        },
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: "Insufficient permissions to delete this folder" },
        { status: 403 }
      );
    }

    // Delete folder (this will fail if folder contains items)
    await documentService.deleteFolder(folderId);

    return NextResponse.json({
      success: true,
      message: "Folder deleted successfully",
    });

  } catch (error) {
    console.error("Folder deletion error:", error);
    
    if (error instanceof Error && error.message.includes("contains")) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}