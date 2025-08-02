import { NextRequest, NextResponse } from "next/server";
import { AuditLogger } from "@/lib/audit";
import { ApiResponse } from "@/lib/types";

// GET /api/audit - Get audit logs with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId");
    const tableName = searchParams.get("tableName");
    const recordId = searchParams.get("recordId");
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const exportCsv = searchParams.get("export") === "csv";

    if (!entityId) {
      const response: ApiResponse = {
        success: false,
        error: "Entity ID is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      userId: userId || undefined,
      tableName: tableName || undefined,
      recordId: recordId || undefined,
      action: action || undefined,
      limit,
      offset,
    };

    if (exportCsv) {
      const csvContent = await AuditLogger.exportAuditLogs(entityId, options);

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="audit-log-${entityId}-${
            new Date().toISOString().split("T")[0]
          }.csv"`,
        },
      });
    }

    const result = await AuditLogger.getAuditLogs(entityId, options);

    const response: ApiResponse = {
      success: true,
      data: result,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    const response: ApiResponse = {
      success: false,
      error: "Failed to fetch audit logs",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
