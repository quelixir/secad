import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { DocumentService } from '@/lib/services/document-service';
import { prisma } from '@/lib/db';

const documentService = new DocumentService();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the current user session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the document
    const document = await documentService.getDocumentById(params.id);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
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
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Generate the direct download URL from the file provider
    const downloadUrl = await documentService.generateDirectDownloadUrl(
      document
    );

    // Fetch the file from UploadThing
    const fileResponse = await fetch(downloadUrl);

    if (!fileResponse.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get the file content
    const fileBuffer = await fileResponse.arrayBuffer();

    // Return the file with the correct filename in Content-Disposition header
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${document.originalName}"`,
        'Content-Length': document.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
