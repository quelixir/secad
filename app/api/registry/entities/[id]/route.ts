import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiResponse, EntityInput, EntityWithRelations } from '@/lib/types';

// GET /api/entities/[id] - Get a specific entity
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeMembers = searchParams.get('include')?.includes('members');
    const includeSecurities = searchParams
      .get('include')
      ?.includes('securities');
    const includeTransactions = searchParams
      .get('include')
      ?.includes('transactions');

    const entity = await prisma.entity.findUnique({
      where: { id },
      include: {
        members: includeMembers
          ? {
              include: {
                transactionsFrom: {
                  include: {
                    securityClass: true,
                  },
                },
                transactionsTo: {
                  include: {
                    securityClass: true,
                  },
                },
              },
            }
          : false,
        securityClasses: includeSecurities
          ? {
              include: {
                _count: {
                  select: {
                    transactions: true,
                  },
                },
              },
            }
          : false,
        transactions: includeTransactions
          ? {
              include: {
                securityClass: true,
                fromMember: true,
                toMember: true,
              },
              orderBy: {
                transactionDate: 'desc',
              },
            }
          : false,
        _count: {
          select: {
            members: true,
            securityClasses: true,
            transactions: true,
            associates: true,
          },
        },
      },
    });

    if (!entity) {
      const response: ApiResponse = {
        success: false,
        error: 'Entity not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<EntityWithRelations> = {
      success: true,
      data: entity,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching entity:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch entity',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/entities/[id] - Update an entity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: Partial<EntityInput> = await request.json();

    // Check if entity exists
    const existingEntity = await prisma.entity.findUnique({
      where: { id },
    });

    if (!existingEntity) {
      const response: ApiResponse = {
        success: false,
        error: 'Entity not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check for duplicate ABN/ACN if being updated
    if (body.abn || body.acn) {
      const duplicate = await prisma.entity.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                body.abn ? { abn: body.abn } : {},
                body.acn ? { acn: body.acn } : {},
              ].filter((condition) => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (duplicate) {
        const response: ApiResponse = {
          success: false,
          error: 'Another entity with this ABN or ACN already exists',
        };
        return NextResponse.json(response, { status: 409 });
      }
    }

    // Build update data object
    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.abn !== undefined) updateData.abn = body.abn || null;
    if (body.acn !== undefined) updateData.acn = body.acn || null;
    if (body.entityType) updateData.entityType = body.entityType;
    if (body.incorporationDate !== undefined)
      updateData.incorporationDate = body.incorporationDate || null;
    if (body.address !== undefined) updateData.address = body.address || null;
    if (body.city !== undefined) updateData.city = body.city || null;
    if (body.state !== undefined) updateData.state = body.state || null;
    if (body.postcode !== undefined)
      updateData.postcode = body.postcode || null;
    if (body.country !== undefined)
      updateData.country = body.country || 'Australia';
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.website !== undefined) updateData.website = body.website || null;

    const entity = await prisma.entity.update({
      where: { id },
      data: updateData,
    });

    const response: ApiResponse<EntityWithRelations> = {
      success: true,
      data: entity,
      message: 'Entity updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating entity:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update entity',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/entities/[id] - Delete an entity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if entity exists
    const existingEntity = await prisma.entity.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            securityClasses: true,
            transactions: true,
          },
        },
      },
    });

    if (!existingEntity) {
      const response: ApiResponse = {
        success: false,
        error: 'Entity not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check if entity has related data
    if (
      existingEntity._count.members > 0 ||
      existingEntity._count.securityClasses > 0 ||
      existingEntity._count.transactions > 0
    ) {
      const response: ApiResponse = {
        success: false,
        error:
          'Cannot delete entity with existing members, securities, or transactions',
      };
      return NextResponse.json(response, { status: 409 });
    }

    await prisma.entity.delete({
      where: { id },
    });

    const response: ApiResponse = {
      success: true,
      message: 'Entity deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting entity:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete entity',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
