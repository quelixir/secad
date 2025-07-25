import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiResponse, MemberInput } from '@/lib/types';
import { AuditLogger, AuditTableName } from '@/lib/audit';
import { auth } from '@/lib/auth';

// GET /api/members - List all members (optionally filtered by entity)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');

    const whereClause = entityId ? { entityId } : {};

    const members = await prisma.member.findMany({
      where: whereClause,
      include: {
        entity: true,
      },
      orderBy: [
        { entity: { name: 'asc' } },
        { lastName: 'asc' },
        { firstName: 'asc' },
        { entityName: 'asc' },
      ],
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: members,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching members:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch members',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/members - Create a new member
export async function POST(request: NextRequest) {
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

    const body: MemberInput = await request.json();

    // Validate required fields
    if (!body.entityId) {
      const response: ApiResponse = {
        success: false,
        error: 'Entity ID is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (!body.memberType) {
      const response: ApiResponse = {
        success: false,
        error: 'Member type is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Validate member type specific fields
    if (
      body.memberType === 'Individual' &&
      (!body.firstName || !body.lastName)
    ) {
      const response: ApiResponse = {
        success: false,
        error: 'Given names and last name are required for individual members',
      };
      return NextResponse.json(response, { status: 400 });
    }

    if (body.memberType !== 'Individual' && !body.entityName) {
      const response: ApiResponse = {
        success: false,
        error: 'Entity name is required for non-individual members',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if member number is unique within the entity (if provided)
    if (body.memberNumber) {
      const existingMember = await prisma.member.findFirst({
        where: {
          entityId: body.entityId,
          memberNumber: body.memberNumber,
        },
      });

      if (existingMember) {
        const response: ApiResponse = {
          success: false,
          error: 'Member number already exists for this entity',
        };
        return NextResponse.json(response, { status: 409 });
      }
    }

    const member = await prisma.member.create({
      data: {
        entityId: body.entityId,
        firstName: body.firstName || null,
        lastName: body.lastName || null,
        entityName: body.entityName || null,
        memberType: body.memberType,
        beneficiallyHeld: body.beneficiallyHeld ?? true,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        postcode: body.postcode || null,
        country: body.country || 'Australia',
        memberNumber: body.memberNumber || null,
        designation: body.designation || null,
        tfn: body.tfn || null,
        abn: body.abn || null,
        createdBy: userId, // Use actual user ID from auth
      },
      include: {
        entity: true,
        contacts: true,
      },
    });

    // Log the creation
    await AuditLogger.logCreate(
      body.entityId,
      userId, // Use actual user ID from auth
      AuditTableName.MEMBER,
      member.id,
      member
    );

    const response: ApiResponse<any> = {
      success: true,
      data: member,
      message: 'Member created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating member:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create member',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
