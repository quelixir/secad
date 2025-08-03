import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { AuditLogger } from "@/lib/audit";

export interface CertificateAnalyticsRequest {
  entityId: string;
  startDate?: string;
  endDate?: string;
  days?: number;
}

export interface CertificateAnalyticsResponse {
  success: boolean;
  data?: {
    analytics: {
      totalGenerations: number;
      totalDownloads: number;
      totalAccesses: number;
      averageFileSize: number;
      mostUsedTemplates: Array<{
        templateId: string;
        templateName: string;
        count: number;
      }>;
      generationTrends: Array<{ date: string; count: number }>;
      formatDistribution: { PDF: number; DOCX: number };
    };
    summary: {
      recentGenerations: number;
      recentDownloads: number;
      recentAccesses: number;
      topTemplates: Array<{
        templateId: string;
        templateName: string;
        count: number;
      }>;
      recentActivity: Array<{
        timestamp: string;
        action: string;
        certificateNumber: string;
        templateName: string;
        user: string;
      }>;
    };
  };
  error?: string;
}

/**
 * GET /api/audit/certificates/analytics
 * Get certificate generation analytics and summary data
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const days = searchParams.get("days");

    // Validate required parameters
    if (!entityId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameter: entityId" },
        { status: 400 },
      );
    }

    // Build options for analytics
    const options: any = {};
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    if (endDate) {
      options.endDate = new Date(endDate);
    }

    // Get analytics data
    const analytics = await AuditLogger.getCertificateGenerationAnalytics(
      entityId,
      options,
    );

    // Get summary data
    const summaryDays = days ? parseInt(days) : 30;
    const summary = await AuditLogger.getCertificateEventSummary(
      entityId,
      summaryDays,
    );

    const response: CertificateAnalyticsResponse = {
      success: true,
      data: {
        analytics,
        summary,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting certificate analytics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/audit/certificates/analytics
 * Get certificate analytics with request body parameters
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body: CertificateAnalyticsRequest = await request.json();
    const { entityId, startDate, endDate, days } = body;

    // Validate required parameters
    if (!entityId) {
      return NextResponse.json(
        { success: false, error: "Missing required field: entityId" },
        { status: 400 },
      );
    }

    // Build options for analytics
    const options: any = {};
    if (startDate) {
      options.startDate = new Date(startDate);
    }
    if (endDate) {
      options.endDate = new Date(endDate);
    }

    // Get analytics data
    const analytics = await AuditLogger.getCertificateGenerationAnalytics(
      entityId,
      options,
    );

    // Get summary data
    const summaryDays = days || 30;
    const summary = await AuditLogger.getCertificateEventSummary(
      entityId,
      summaryDays,
    );

    const response: CertificateAnalyticsResponse = {
      success: true,
      data: {
        analytics,
        summary,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting certificate analytics:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
