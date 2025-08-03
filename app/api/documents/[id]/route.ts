import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DocumentService } from "@/lib/services/document-service";
import { prisma } from "@/lib/db";
import { z } from "zod";

const documentService = new DocumentService();

// GET /api/documents/[id] - Get a specific document
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
    const documentId = resolvedParams.id;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const document = await documentService.getDocumentById(documentId);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check entity access
    const access = await prisma.userEntityAccess.findFirst({
      where: {
        userId: session.user.id,
        entityId: document.entityId,
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
      data: document,
    });

  } catch (error) {
    console.error("Document fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/documents/[id] - Update a document
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
    const documentId = resolvedParams.id;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const updateDocumentSchema = z.object({
      fileName: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      folderId: z.string().optional(),
    });

    const validatedData = updateDocumentSchema.parse(body);

    // Get document and check access
    const document = await documentService.getDocumentById(documentId);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check entity access (Admin/Editor only)
    const access = await prisma.userEntityAccess.findFirst({
      where: {
        userId: session.user.id,
        entityId: document.entityId,
        role: {
          in: ["Admin", "Editor"],
        },
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: "Insufficient permissions to modify this document" },
        { status: 403 }
      );
    }

    // Update document
    const updatedDocument = await documentService.updateDocument(
      documentId,
      validatedData
    );

    return NextResponse.json({
      success: true,
      data: updatedDocument,
    });

  } catch (error) {
    console.error("Document update error:", error);
    
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

// DELETE /api/documents/[id] - Delete a document
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
    const documentId = resolvedParams.id;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Get document and check access
    const document = await documentService.getDocumentById(documentId);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Check entity access (Admin/Editor only)
    const access = await prisma.userEntityAccess.findFirst({
      where: {
        userId: session.user.id,
        entityId: document.entityId,
        role: {
          in: ["Admin", "Editor"],
        },
      },
    });

    if (!access) {
      return NextResponse.json(
        { error: "Insufficient permissions to delete this document" },
        { status: 403 }
      );
    }

    // Delete document (this will also delete from file provider)
    await documentService.deleteDocument(documentId);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });

  } catch (error) {
    console.error("Document deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}