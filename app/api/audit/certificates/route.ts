import { NextRequest, NextResponse } from "next/server";
import { AuditLogger } from "@/lib/audit";

export interface CertificateAuditQuery {
  entityId: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  transactionId?: string;
  templateId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

/**
 * GET /api/audit/certificates
 * Get certificate-specific audit logs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");
    const transactionId = searchParams.get("transactionId");
    const templateId = searchParams.get("templateId");
    const action = searchParams.get("action");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    if (!entityId) {
      return NextResponse.json(
        { error: "entityId is required" },
        { status: 400 }
      );
    }

    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      userId: userId || undefined,
      tableName: transactionId ? "Transaction" : undefined,
      recordId: transactionId || templateId || undefined,
      action: action || undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    };

    let result;
    if (transactionId) {
      // Get certificate logs for a specific transaction
      result = await AuditLogger.getTransactionCertificateLogs(
        entityId,
        transactionId,
        options
      );
    } else if (templateId) {
      // Get certificate template logs
      result = await AuditLogger.getCertificateTemplateLogs(
        entityId,
        templateId,
        options
      );
    } else {
      // Get all certificate audit logs
      result = await AuditLogger.getCertificateAuditLogs(entityId, options);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching certificate audit logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/audit/certificates
 * Export certificate audit logs as CSV
 */
export async function POST(request: NextRequest) {
  try {
    const body: CertificateAuditQuery = await request.json();
    const {
      entityId,
      startDate,
      endDate,
      userId,
      transactionId,
      templateId,
      action,
    } = body;

    if (!entityId) {
      return NextResponse.json(
        { error: "entityId is required" },
        { status: 400 }
      );
    }

    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      userId: userId || undefined,
      tableName: transactionId ? "Transaction" : undefined,
      recordId: transactionId || templateId || undefined,
      action: action || undefined,
    };

    let result;
    if (transactionId) {
      // Get certificate logs for a specific transaction
      result = await AuditLogger.getTransactionCertificateLogs(
        entityId,
        transactionId,
        options
      );
    } else if (templateId) {
      // Get certificate template logs
      result = await AuditLogger.getCertificateTemplateLogs(
        entityId,
        templateId,
        options
      );
    } else {
      // Get all certificate audit logs
      result = await AuditLogger.getCertificateAuditLogs(entityId, options);
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching certificate audit logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
