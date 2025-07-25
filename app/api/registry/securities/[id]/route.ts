import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiResponse, SecurityClassInput } from '@/lib/types';
import { AuditLogger } from '@/lib/audit';
import { AuditAction, AuditTableName } from '@/lib/audit';
import { auth } from '@/lib/auth';

// GET /api/securities/[id] - Get a specific security class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeHoldings = searchParams.get('include')?.includes('holdings');

    const securityClass = await prisma.securityClass.findUnique({
      where: { id },
      include: {
        entity: true,
        transactions: includeHoldings
          ? {
              include: {
                fromMember: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    entityName: true,
                    memberType: true,
                    memberNumber: true,
                  },
                },
                toMember: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    entityName: true,
                    memberType: true,
                    memberNumber: true,
                  },
                },
              },
            }
          : false,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!securityClass) {
      const response: ApiResponse = {
        success: false,
        error: 'Security class not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: securityClass,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching security class:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch security class',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/securities/[id] - Update a security class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user session from auth
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized',
      };
      return NextResponse.json(response, { status: 401 });
    }
    const { id } = await params;
    const body: Partial<SecurityClassInput> = await request.json();

    // Check if security class exists
    const existingSecurity = await prisma.securityClass.findUnique({
      where: { id },
    });

    if (!existingSecurity) {
      const response: ApiResponse = {
        success: false,
        error: 'Security class not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check for duplicate name if being updated and within same entity
    if (body.name && body.name !== existingSecurity.name) {
      const duplicate = await prisma.securityClass.findFirst({
        where: {
          entityId: existingSecurity.entityId,
          name: body.name,
          id: { not: id },
        },
      });

      if (duplicate) {
        const response: ApiResponse = {
          success: false,
          error: 'Security class name already exists for this entity',
        };
        return NextResponse.json(response, { status: 409 });
      }
    }

    // Build update data object
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.symbol !== undefined) updateData.symbol = body.symbol || null;
    if (body.description !== undefined)
      updateData.description = body.description || null;
    if (body.votingRights !== undefined)
      updateData.votingRights = body.votingRights;
    if (body.dividendRights !== undefined)
      updateData.dividendRights = body.dividendRights;
    if (body.customRights !== undefined)
      updateData.customRights = body.customRights;
    if (body.isArchived !== undefined) updateData.isArchived = body.isArchived;

    // Get the old values for audit logging
    const oldValues: Record<string, any> = {};
    if (body.name) oldValues.name = existingSecurity.name;
    if (body.symbol !== undefined) oldValues.symbol = existingSecurity.symbol;
    if (body.description !== undefined)
      oldValues.description = existingSecurity.description;
    if (body.votingRights !== undefined)
      oldValues.votingRights = existingSecurity.votingRights;
    if (body.dividendRights !== undefined)
      oldValues.dividendRights = existingSecurity.dividendRights;
    if (body.customRights !== undefined)
      oldValues.customRights = existingSecurity.customRights;
    if (body.isArchived !== undefined)
      oldValues.isArchived = existingSecurity.isArchived;

    const securityClass = await prisma.securityClass.update({
      where: { id },
      data: updateData,
      include: {
        entity: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    // Log only the fields that have actually changed
    const changedFields = AuditLogger.getChangedFields(oldValues, updateData);
    if (Object.keys(changedFields).length > 0) {
      await AuditLogger.logRecordChanges(
        existingSecurity.entityId,
        userId, // Use actual user ID from auth
        AuditAction.UPDATE,
        AuditTableName.SECURITY_CLASS,
        id,
        changedFields
      );
    }

    const response: ApiResponse = {
      success: true,
      data: securityClass,
      message: 'Security class updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating security class:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update security class',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PATCH /api/securities/[id] - Archive/unarchive a security class
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user session from auth
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      const response: ApiResponse = {
        success: false,
        error: 'Unauthorized',
      };
      return NextResponse.json(response, { status: 401 });
    }
    const { id } = await params;
    const body: { action: 'archive' | 'unarchive' } = await request.json();

    // Check if security class exists
    const existingSecurity = await prisma.securityClass.findUnique({
      where: { id },
    });

    if (!existingSecurity) {
      const response: ApiResponse = {
        success: false,
        error: 'Security class not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const isArchived = body.action === 'archive';

    // Check if already in desired state
    if (existingSecurity.isArchived === isArchived) {
      const response: ApiResponse = {
        success: false,
        error: `Security class is already ${
          isArchived ? 'archived' : 'active'
        }`,
      };
      return NextResponse.json(response, { status: 409 });
    }

    const securityClass = await prisma.securityClass.update({
      where: { id },
      data: { isArchived },
      include: {
        entity: true,
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    // Log the archive action
    await AuditLogger.logArchive(
      existingSecurity.entityId,
      userId, // Use actual user ID from auth
      AuditTableName.SECURITY_CLASS,
      id,
      isArchived
    );

    const response: ApiResponse = {
      success: true,
      data: securityClass,
      message: `Security class ${
        isArchived ? 'archived' : 'unarchived'
      } successfully`,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error archiving/unarchiving security class:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to archive/unarchive security class',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/securities/[id] - Delete a security class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if security class exists and get transaction counts
    const existingSecurity = await prisma.securityClass.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            transactions: true,
          },
        },
      },
    });

    if (!existingSecurity) {
      const response: ApiResponse = {
        success: false,
        error: 'Security class not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check if security class has transactions
    if (existingSecurity._count.transactions > 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Cannot delete security class with existing transactions',
      };
      return NextResponse.json(response, { status: 409 });
    }

    await prisma.securityClass.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Security class deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting security class:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete security class',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
