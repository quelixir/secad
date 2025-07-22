import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { AuditLogger } from '@/lib/audit';

/**
 * GET /api/registry/members/{id}/contacts
 *
 * Retrieves all contacts associated with a specific member.
 * Contacts are ordered by primary status first, then by name.
 *
 * @param request - The HTTP request
 * @param params - Contains the member ID
 * @returns Array of member contacts
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const contacts = await prisma.memberContact.findMany({
      where: { memberId: id },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    });

    const response: ApiResponse<any[]> = {
      success: true,
      data: contacts,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching member contacts:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch member contacts',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/members/[id]/contacts - Create a new contact for a member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      const response: ApiResponse = {
        success: false,
        error: 'Contact name is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if member exists
    const member = await prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      const response: ApiResponse = {
        success: false,
        error: 'Member not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // If this is a primary contact, unset other primary contacts
    if (body.isPrimary) {
      await prisma.memberContact.updateMany({
        where: { memberId: id, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const contact = await prisma.memberContact.create({
      data: {
        memberId: id,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        role: body.role || null,
        isPrimary: body.isPrimary || false,
      },
    });

    // Log the creation
    await AuditLogger.logCreate(
      member.entityId,
      'system', // TODO: Get actual user ID from auth
      'MemberContact',
      contact.id,
      contact
    );

    const response: ApiResponse = {
      success: true,
      data: contact,
      message: 'Contact created successfully',
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating member contact:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to create member contact',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
