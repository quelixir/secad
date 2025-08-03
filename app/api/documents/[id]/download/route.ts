import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { DocumentService } from "@/lib/services/document-service";
import { prisma } from "@/lib/db";

const documentService = new DocumentService();

// GET /api/documents/[id]/download - Generate download URL for a document
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

    // Get document and check access
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

    // Generate download URL
    const downloadUrl = await documentService.generateDownloadUrl(document);

    // For direct download, redirect to the file URL
    const redirect = request.nextUrl.searchParams.get("redirect");
    if (redirect === "true") {
      return NextResponse.redirect(downloadUrl);
    }

    // Otherwise return the URL as JSON
    return NextResponse.json({
      success: true,
      data: {
        url: downloadUrl,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
      },
    });

  } catch (error) {
    console.error("Document download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}