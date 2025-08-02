import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  CertificateTemplateInput,
  CertificateTemplateListResponse,
  CertificateTemplateResponse,
} from "@/lib/types/interfaces";
import {
  getAvailableTemplates,
  validateTemplateScope,
  validateTemplateHtml,
  validateDefaultTemplateConstraint,
} from "@/lib/certificate-templates/scope-validation";
import { TemplateValidationService } from "@/lib/certificate-templates/template-validation";

// GET /api/registry/certificate-templates
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");
    const scopeId = searchParams.get("scopeId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Get available templates using scope validation helper
    const { globalTemplates, userTemplates, entityTemplates } =
      await getAvailableTemplates(userId, scopeId || undefined);

    // Combine all templates
    const allTemplates = [
      ...globalTemplates,
      ...userTemplates,
      ...entityTemplates,
    ];

    // Apply pagination
    const total = allTemplates.length;
    const templates = allTemplates.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: {
        templates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching certificate templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch certificate templates" },
      { status: 500 }
    );
  }
}

// POST /api/registry/certificate-templates
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: CertificateTemplateInput = await request.json();

    // Validate required fields
    if (!body.name || !body.templateHtml || !body.scope) {
      return NextResponse.json(
        {
          success: false,
          error: "Name, template HTML, and scope are required",
        },
        { status: 400 }
      );
    }

    // Validate scope and permissions using helper function
    const scopeValidation = await validateTemplateScope(
      userId,
      body.scope,
      body.scopeId
    );
    if (!scopeValidation.isValid) {
      return NextResponse.json(
        { success: false, error: scopeValidation.error },
        { status: 400 }
      );
    }

    if (!scopeValidation.hasAccess) {
      return NextResponse.json(
        { success: false, error: scopeValidation.accessError },
        { status: 403 }
      );
    }

    // Validate template using comprehensive validation service
    const validationService = new TemplateValidationService();
    const templateForValidation = {
      id: "temp",
      name: body.name,
      description: body.description || "",
      templateHtml: body.templateHtml,
      templateCss: body.templateCss || "",
      scope: body.scope,
      scopeId: body.scopeId || null,
      isDefault: body.isDefault || false,
      isActive: body.isActive !== false,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const validationResult = validationService.validateTemplate(
      templateForValidation
    );

    if (!validationResult.isValid) {
      const errorMessages =
        validationService.formatValidationErrors(validationResult);
      return NextResponse.json(
        {
          success: false,
          error: "Template validation failed",
          details: errorMessages,
          warnings:
            validationService.formatValidationWarnings(validationResult),
        },
        { status: 400 }
      );
    }

    // Check for default template constraint using helper function
    if (body.isDefault) {
      const defaultValidation = await validateDefaultTemplateConstraint(
        body.scope,
        body.scopeId
      );
      if (!defaultValidation.isValid) {
        return NextResponse.json(
          { success: false, error: defaultValidation.error },
          { status: 400 }
        );
      }
    }

    // Create template
    const template = await prisma.certificateTemplate.create({
      data: {
        name: body.name,
        description: body.description || null,
        templateHtml: body.templateHtml,
        templateCss: body.templateCss || null,
        scope: body.scope,
        scopeId: body.scopeId || null,
        isDefault: body.isDefault || false,
        isActive: body.isActive !== false, // Default to true
        createdBy: userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: template,
        message: "Certificate template created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating certificate template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create certificate template" },
      { status: 500 }
    );
  }
}
