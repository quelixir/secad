import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiResponse } from '@/lib/types';
import { AuditLogger } from '@/lib/audit';
import { AuditAction, AuditTableName } from '@/lib/audit';
import { auth } from '@/lib/auth';

// GET /api/members/[id]/contacts/[contactId] - Get a specific contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params;

    const contact = await prisma.memberContact.findUnique({
      where: { id: contactId },
      include: {
        member: {
          select: {
            id: true,
            entityId: true,
          },
        },
      },
    });

    if (!contact) {
      const response: ApiResponse = {
        success: false,
        error: 'Contact not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse = {
      success: true,
      data: contact,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching contact:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to fetch contact',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/members/[id]/contacts/[contactId] - Update a contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
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
    const { contactId } = await params;
    const body = await request.json();

    // Check if contact exists
    const existingContact = await prisma.memberContact.findUnique({
      where: { id: contactId },
      include: {
        member: {
          select: {
            id: true,
            entityId: true,
          },
        },
      },
    });

    if (!existingContact) {
      const response: ApiResponse = {
        success: false,
        error: 'Contact not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Validate required fields
    if (!body.name) {
      const response: ApiResponse = {
        success: false,
        error: 'Contact name is required',
      };
      return NextResponse.json(response, { status: 400 });
    }

    // If this is being set as primary, unset other primary contacts
    if (body.isPrimary) {
      await prisma.memberContact.updateMany({
        where: {
          memberId: existingContact.memberId,
          id: { not: contactId },
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    // Build update data object
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email || null;
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.role !== undefined) updateData.role = body.role || null;
    if (body.isPrimary !== undefined) updateData.isPrimary = body.isPrimary;

    // Get the old values for audit logging
    const oldValues: Record<string, any> = {};
    if (body.name !== undefined) oldValues.name = existingContact.name;
    if (body.email !== undefined) oldValues.email = existingContact.email;
    if (body.phone !== undefined) oldValues.phone = existingContact.phone;
    if (body.role !== undefined) oldValues.role = existingContact.role;
    if (body.isPrimary !== undefined)
      oldValues.isPrimary = existingContact.isPrimary;

    const contact = await prisma.memberContact.update({
      where: { id: contactId },
      data: updateData,
    });

    // Log only the fields that have actually changed
    const changedFields = AuditLogger.getChangedFields(oldValues, updateData);
    if (Object.keys(changedFields).length > 0) {
      await AuditLogger.logRecordChanges(
        existingContact.member.entityId,
        userId, // Use actual user ID from auth
        AuditAction.UPDATE,
        AuditTableName.MEMBER_CONTACT,
        contactId,
        changedFields
      );
    }

    const response: ApiResponse = {
      success: true,
      data: contact,
      message: 'Contact updated successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating contact:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to update contact',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/members/[id]/contacts/[contactId] - Delete a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
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
    const { contactId } = await params;

    // Check if contact exists
    const existingContact = await prisma.memberContact.findUnique({
      where: { id: contactId },
      include: {
        member: {
          select: {
            id: true,
            entityId: true,
          },
        },
      },
    });

    if (!existingContact) {
      const response: ApiResponse = {
        success: false,
        error: 'Contact not found',
      };
      return NextResponse.json(response, { status: 404 });
    }

    await prisma.memberContact.delete({
      where: { id: contactId },
    });

    // Log the deletion
    await AuditLogger.logDelete(
      existingContact.member.entityId,
      userId, // Use actual user ID from auth
      AuditTableName.MEMBER_CONTACT,
      contactId,
      existingContact
    );

    const response: ApiResponse = {
      success: true,
      message: 'Contact deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting contact:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to delete contact',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
