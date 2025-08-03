import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DocumentService } from "@/lib/services/document-service";
import { prisma } from "@/lib/db";
import { z } from "zod";

const documentService = new DocumentService();

// POST /api/documents - Create a document record after UploadThing upload
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
    const createDocumentSchema = z.object({
      entityId: z.string().min(1),
      fileName: z.string().min(1),
      originalName: z.string().min(1),
      fileSize: z.number().min(1),
      mimeType: z.string().min(1),
      fileUrl: z.string().url(),
      uploadKey: z.string().min(1),
      folderId: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    });

    const validatedData = createDocumentSchema.parse(body);

    // Check entity access
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

    // Create document record
    const document = await documentService.createDocument({
      ...validatedData,
      uploadedBy: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: document,
    });

  } catch (error) {
    console.error("Document creation error:", error);
    
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

// GET /api/documents - List documents for an entity
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
    const folderId = searchParams.get("folderId") || undefined;

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

    const documents = await documentService.getDocuments(entityId, folderId);

    return NextResponse.json({
      success: true,
      data: documents,
    });

  } catch (error) {
    console.error("Document listing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}