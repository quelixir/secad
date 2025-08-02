import { CertificateTemplate } from "../generated/prisma";

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  completenessScore: number;
  missingVariables: string[];
  invalidFormats: string[];
  fallbackValues: Record<string, string>;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

export interface TemplateData {
  entityName?: string;
  entityType?: string;
  entityAddress?: string;
  entityContact?: string;
  entityPhone?: string;
  entityEmail?: string;
  memberName?: string;
  memberType?: string;
  memberAddress?: string;
  memberContact?: string;
  transactionId?: string;
  transactionDate?: string;
  transactionType?: string;
  transactionReason?: string;
  securityName?: string;
  securitySymbol?: string;
  securityClass?: string;
  quantity?: string;
  unitPrice?: string;
  totalValue?: string;
  transactionAmount?: string;
  currency?: string;
  fees?: string;
  netAmount?: string;
  certificateNumber?: string;
  generationDate?: string;
  generationTimestamp?: string;
}

export interface ValidationRule {
  field: string;
  required: boolean;
  format?: RegExp;
  minLength?: number;
  maxLength?: number;
  fallback?: string;
  validationMessage?: string;
}

export class TemplateValidationService {
  private readonly requiredFields: ValidationRule[] = [
    { field: "entityName", required: true, minLength: 2, maxLength: 200 },
    { field: "memberName", required: true, minLength: 2, maxLength: 200 },
    {
      field: "transactionId",
      required: true,
      format: /^[A-Z0-9\-_]+$/,
      minLength: 5,
      maxLength: 50,
    },
    { field: "transactionDate", required: true, format: /^\d{4}-\d{2}-\d{2}$/ },
    { field: "securityName", required: true, minLength: 2, maxLength: 200 },
    {
      field: "quantity",
      required: true,
      format: /^\d+(\.\d+)?$/,
      minLength: 1,
    },
    {
      field: "transactionAmount",
      required: true,
      format: /^[A-Z]{3}\s+\d+(\.\d{2})?$/,
      minLength: 5,
    },
    {
      field: "currency",
      required: true,
      format: /^[A-Z]{3}$/,
      minLength: 3,
      maxLength: 3,
    },
  ];

  private readonly optionalFields: ValidationRule[] = [
    { field: "entityType", required: false, fallback: "Entity" },
    {
      field: "entityAddress",
      required: false,
      fallback: "Address not provided",
    },
    {
      field: "entityContact",
      required: false,
      fallback: "Contact not provided",
    },
    { field: "entityPhone", required: false, fallback: "Phone not provided" },
    { field: "entityEmail", required: false, fallback: "Email not provided" },
    { field: "memberType", required: false, fallback: "Member" },
    {
      field: "memberAddress",
      required: false,
      fallback: "Address not provided",
    },
    {
      field: "memberContact",
      required: false,
      fallback: "Contact not provided",
    },
    { field: "transactionType", required: false, fallback: "Transaction" },
    { field: "transactionReason", required: false, fallback: "Not specified" },
    { field: "securitySymbol", required: false, fallback: "N/A" },
    { field: "securityClass", required: false, fallback: "Security" },
    { field: "unitPrice", required: false, fallback: "Price not available" },
    { field: "totalValue", required: false, fallback: "Value not available" },
    { field: "fees", required: false, fallback: "No fees" },
    { field: "netAmount", required: false, fallback: "Amount not available" },
    {
      field: "certificateNumber",
      required: false,
      fallback: "CERT-{{timestamp}}",
    },
    { field: "generationDate", required: false, fallback: "{{currentDate}}" },
    {
      field: "generationTimestamp",
      required: false,
      fallback: "{{currentTimestamp}}",
    },
  ];

  /**
   * Validates template data against all validation rules
   */
  validateTemplateData(data: TemplateData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const fallbackValues: Record<string, string> = {};
    const missingVariables: string[] = [];
    const invalidFormats: string[] = [];

    // Validate required fields
    for (const rule of this.requiredFields) {
      const value = data[rule.field as keyof TemplateData];

      if (!value || value.trim() === "") {
        errors.push({
          field: rule.field,
          message: `${rule.field} is required`,
          severity: "error",
          code: "REQUIRED_FIELD_MISSING",
        });
        missingVariables.push(rule.field);
        continue;
      }

      // Validate format if specified
      if (rule.format && !rule.format.test(value)) {
        errors.push({
          field: rule.field,
          message: `${rule.field} format is invalid`,
          severity: "error",
          code: "INVALID_FORMAT",
        });
        invalidFormats.push(rule.field);
      }

      // Validate length constraints
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be at least ${rule.minLength} characters`,
          severity: "error",
          code: "MIN_LENGTH_VIOLATION",
        });
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({
          field: rule.field,
          message: `${rule.field} must be no more than ${rule.maxLength} characters`,
          severity: "error",
          code: "MAX_LENGTH_VIOLATION",
        });
      }
    }

    // Process optional fields and generate fallbacks
    for (const rule of this.optionalFields) {
      const value = data[rule.field as keyof TemplateData];

      if (!value || value.trim() === "") {
        if (rule.fallback) {
          const fallbackValue = this.processFallbackValue(rule.fallback, data);
          fallbackValues[rule.field] = fallbackValue;

          warnings.push({
            field: rule.field,
            message: `${rule.field} is missing, using fallback value`,
            suggestion: `Consider providing a value for ${rule.field}`,
          });
        }
      } else {
        // Validate format for optional fields if provided
        if (rule.format && !rule.format.test(value)) {
          warnings.push({
            field: rule.field,
            message: `${rule.field} format is invalid`,
            suggestion: `Check the format of ${rule.field}`,
          });
          invalidFormats.push(rule.field);
        }
      }
    }

    // Calculate completeness score
    const totalFields = this.requiredFields.length + this.optionalFields.length;
    const providedFields = Object.keys(data).filter(
      (key) =>
        data[key as keyof TemplateData] &&
        data[key as keyof TemplateData]!.trim() !== "",
    ).length;
    const completenessScore = Math.round((providedFields / totalFields) * 100);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completenessScore,
      missingVariables,
      invalidFormats,
      fallbackValues,
    };
  }

  /**
   * Validates template HTML structure and variables
   */
  validateTemplateHtml(template: CertificateTemplate): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const missingVariables: string[] = [];

    // Check if template HTML exists
    if (!template.templateHtml || template.templateHtml.trim() === "") {
      errors.push({
        field: "templateHtml",
        message: "Template HTML is required",
        severity: "error",
        code: "MISSING_TEMPLATE_HTML",
      });
      return {
        isValid: false,
        errors,
        warnings,
        completenessScore: 0,
        missingVariables,
        invalidFormats: [],
        fallbackValues: {},
      };
    }

    // Extract template variables
    const templateVariables = this.extractTemplateVariables(
      template.templateHtml,
    );

    // Check for required template variables
    const requiredTemplateVariables = [
      "entityName",
      "memberName",
      "transactionId",
      "transactionDate",
      "securityName",
      "quantity",
      "transactionAmount",
      "currency",
    ];

    for (const requiredVar of requiredTemplateVariables) {
      if (!templateVariables.includes(requiredVar)) {
        errors.push({
          field: "templateHtml",
          message: `Required template variable {{${requiredVar}}} is missing`,
          severity: "error",
          code: "MISSING_REQUIRED_VARIABLE",
        });
        missingVariables.push(requiredVar);
      }
    }

    // Check for invalid template variables
    const validVariables = [
      "certificateNumber",
      "generationDate",
      "generationTimestamp",
      "entityName",
      "entityType",
      "entityAddress",
      "entityContact",
      "entityPhone",
      "entityEmail",
      "memberName",
      "memberType",
      "memberAddress",
      "memberContact",
      "transactionId",
      "transactionDate",
      "transactionType",
      "transactionReason",
      "securityName",
      "securitySymbol",
      "securityClass",
      "quantity",
      "unitPrice",
      "totalValue",
      "transactionAmount",
      "currency",
      "fees",
      "netAmount",
    ];

    for (const variable of templateVariables) {
      if (!validVariables.includes(variable)) {
        warnings.push({
          field: "templateHtml",
          message: `Unknown template variable {{${variable}}}`,
          suggestion: `Check if {{${variable}}} is a valid variable`,
        });
      }
    }

    // Validate HTML structure
    if (!template.templateHtml.includes("<!DOCTYPE html>")) {
      warnings.push({
        field: "templateHtml",
        message: "Template should include DOCTYPE declaration",
        suggestion: "Add <!DOCTYPE html> at the beginning",
      });
    }

    if (!template.templateHtml.includes("<html")) {
      warnings.push({
        field: "templateHtml",
        message: "Template should include HTML tags",
        suggestion: "Wrap content in <html> tags",
      });
    }

    // Calculate completeness score for template
    const totalRequiredVars = requiredTemplateVariables.length;
    const providedRequiredVars = requiredTemplateVariables.filter((v) =>
      templateVariables.includes(v),
    ).length;
    const completenessScore = Math.round(
      (providedRequiredVars / totalRequiredVars) * 100,
    );

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completenessScore,
      missingVariables,
      invalidFormats: [],
      fallbackValues: {},
    };
  }

  /**
   * Validates template CSS
   */
  validateTemplateCss(template: CertificateTemplate): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if CSS exists (optional but recommended)
    if (!template.templateCss || template.templateCss.trim() === "") {
      warnings.push({
        field: "templateCss",
        message: "Template CSS is missing",
        suggestion: "Consider adding CSS for better styling",
      });
    } else {
      // Basic CSS validation
      if (!template.templateCss.includes("@page")) {
        warnings.push({
          field: "templateCss",
          message: "Print styles (@page) are recommended",
          suggestion: "Add @page rules for better print formatting",
        });
      }

      if (!template.templateCss.includes("@media print")) {
        warnings.push({
          field: "templateCss",
          message: "Print media queries are recommended",
          suggestion: "Add @media print rules for print optimization",
        });
      }
    }

    return {
      isValid: true,
      errors,
      warnings,
      completenessScore: template.templateCss ? 100 : 50,
      missingVariables: [],
      invalidFormats: [],
      fallbackValues: {},
    };
  }

  /**
   * Comprehensive template validation
   */
  validateTemplate(
    template: CertificateTemplate,
    data?: TemplateData,
  ): ValidationResult {
    const htmlValidation = this.validateTemplateHtml(template);
    const cssValidation = this.validateTemplateCss(template);

    const combinedErrors = [...htmlValidation.errors, ...cssValidation.errors];
    const combinedWarnings = [
      ...htmlValidation.warnings,
      ...cssValidation.warnings,
    ];

    let dataValidation: ValidationResult | null = null;
    if (data) {
      dataValidation = this.validateTemplateData(data);
      combinedErrors.push(...dataValidation.errors);
      combinedWarnings.push(...dataValidation.warnings);
    }

    // Calculate overall completeness score
    const scores = [
      htmlValidation.completenessScore,
      cssValidation.completenessScore,
    ];
    if (dataValidation) {
      scores.push(dataValidation.completenessScore);
    }
    const overallScore = Math.round(
      scores.reduce((a, b) => a + b, 0) / scores.length,
    );

    return {
      isValid: combinedErrors.length === 0,
      errors: combinedErrors,
      warnings: combinedWarnings,
      completenessScore: overallScore,
      missingVariables: [
        ...htmlValidation.missingVariables,
        ...(dataValidation?.missingVariables || []),
      ],
      invalidFormats: dataValidation?.invalidFormats || [],
      fallbackValues: dataValidation?.fallbackValues || {},
    };
  }

  /**
   * Extract template variables from HTML
   */
  private extractTemplateVariables(html: string): string[] {
    const variables: string[] = [];
    const variableRegex = /\{\{(\w+)\}\}/g;
    let match;

    while ((match = variableRegex.exec(html)) !== null) {
      variables.push(match[1]);
    }

    return [...new Set(variables)]; // Remove duplicates
  }

  /**
   * Process fallback values with dynamic content
   */
  private processFallbackValue(fallback: string, data: TemplateData): string {
    let processedFallback = fallback;

    // Replace dynamic placeholders
    if (fallback.includes("{{timestamp}}")) {
      processedFallback = processedFallback.replace(
        "{{timestamp}}",
        Date.now().toString(),
      );
    }

    if (fallback.includes("{{currentDate}}")) {
      processedFallback = processedFallback.replace(
        "{{currentDate}}",
        new Date().toLocaleDateString(),
      );
    }

    if (fallback.includes("{{currentTimestamp}}")) {
      processedFallback = processedFallback.replace(
        "{{currentTimestamp}}",
        new Date().toISOString(),
      );
    }

    return processedFallback;
  }

  /**
   * Get validation rules for a specific field
   */
  getValidationRule(field: string): ValidationRule | null {
    const allRules = [...this.requiredFields, ...this.optionalFields];
    return allRules.find((rule) => rule.field === field) || null;
  }

  /**
   * Get all validation rules
   */
  getAllValidationRules(): ValidationRule[] {
    return [...this.requiredFields, ...this.optionalFields];
  }

  /**
   * Format validation error messages for display
   */
  formatValidationErrors(result: ValidationResult): string[] {
    return result.errors.map((error) => `${error.field}: ${error.message}`);
  }

  /**
   * Format validation warnings for display
   */
  formatValidationWarnings(result: ValidationResult): string[] {
    return result.warnings.map(
      (warning) => `${warning.field}: ${warning.message}`,
    );
  }
}
