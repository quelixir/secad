import { AuditLogger } from "@/lib/audit";

/**
 * Error categories for certificate generation
 */
export enum ErrorCategory {
  VALIDATION = "validation",
  SYSTEM = "system",
  NETWORK = "network",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  RATE_LIMIT = "rate_limit",
  TIMEOUT = "timeout",
  MEMORY = "memory",
  DATABASE = "database",
  FILE_SYSTEM = "file_system",
  TEMPLATE = "template",
  PDF_GENERATION = "pdf_generation",
  UNKNOWN = "unknown",
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Error context information
 */
export interface ErrorContext {
  transactionId?: string;
  entityId?: string;
  templateId?: string;
  userId?: string;
  certificateNumber?: string;
  format?: "PDF" | "DOCX";
  userAgent?: string;
  ipAddress?: string;
  requestId?: string;
  generationStartTime?: number;
  retryCount?: number;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  systemInfo?: {
    nodeVersion: string;
    platform: string;
    arch: string;
    uptime: number;
  };
}

/**
 * Certificate generation error
 */
export class CertificateGenerationError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly isRetryable: boolean;
  public readonly userMessage: string;
  public readonly timestamp: Date;
  public readonly originalError?: Error;

  constructor(
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity,
    code: string,
    context: ErrorContext = {},
    isRetryable: boolean = false,
    userMessage?: string,
    originalError?: Error,
  ) {
    super(message);
    this.name = "CertificateGenerationError";
    this.category = category;
    this.severity = severity;
    this.code = code;
    this.context = context;
    this.isRetryable = isRetryable;
    this.userMessage =
      userMessage || this.getDefaultUserMessage(category, message);
    this.timestamp = new Date();
    this.originalError = originalError;
  }

  /**
   * Get default user-friendly message based on error category
   */
  private getDefaultUserMessage(
    category: ErrorCategory,
    message: string,
  ): string {
    const userMessages: Record<ErrorCategory, string> = {
      [ErrorCategory.VALIDATION]:
        "The certificate data is invalid. Please check the information and try again.",
      [ErrorCategory.SYSTEM]:
        "A system error occurred. Please try again later.",
      [ErrorCategory.NETWORK]:
        "Network connection issue. Please check your connection and try again.",
      [ErrorCategory.AUTHENTICATION]:
        "Authentication failed. Please log in again.",
      [ErrorCategory.AUTHORIZATION]:
        "You don't have permission to generate this certificate.",
      [ErrorCategory.RATE_LIMIT]:
        "Too many requests. Please wait a moment and try again.",
      [ErrorCategory.TIMEOUT]: "The request took too long. Please try again.",
      [ErrorCategory.MEMORY]:
        "System is temporarily overloaded. Please try again later.",
      [ErrorCategory.DATABASE]:
        "Database connection issue. Please try again later.",
      [ErrorCategory.FILE_SYSTEM]: "File system error. Please try again later.",
      [ErrorCategory.TEMPLATE]:
        "Certificate template error. Please contact support.",
      [ErrorCategory.PDF_GENERATION]:
        "PDF generation failed. Please try again.",
      [ErrorCategory.UNKNOWN]:
        "An unexpected error occurred. Please try again.",
    };

    return userMessages[category] || userMessages[ErrorCategory.UNKNOWN];
  }

  /**
   * Convert to JSON for logging
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      code: this.code,
      context: this.context,
      isRetryable: this.isRetryable,
      userMessage: this.userMessage,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : undefined,
    };
  }
}

/**
 * Error factory for creating specific certificate generation errors
 */
export class CertificateErrorFactory {
  /**
   * Create validation error
   */
  static validationError(
    message: string,
    context: ErrorContext = {},
    originalError?: Error,
  ): CertificateGenerationError {
    return new CertificateGenerationError(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.MEDIUM,
      "VALIDATION_ERROR",
      context,
      false,
      undefined,
      originalError,
    );
  }

  /**
   * Create system error
   */
  static systemError(
    message: string,
    context: ErrorContext = {},
    originalError?: Error,
  ): CertificateGenerationError {
    return new CertificateGenerationError(
      message,
      ErrorCategory.SYSTEM,
      ErrorSeverity.HIGH,
      "SYSTEM_ERROR",
      context,
      true,
      undefined,
      originalError,
    );
  }

  /**
   * Create network error
   */
  static networkError(
    message: string,
    context: ErrorContext = {},
    originalError?: Error,
  ): CertificateGenerationError {
    return new CertificateGenerationError(
      message,
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      "NETWORK_ERROR",
      context,
      true,
      undefined,
      originalError,
    );
  }

  /**
   * Create authentication error
   */
  static authenticationError(
    message: string,
    context: ErrorContext = {},
    originalError?: Error,
  ): CertificateGenerationError {
    return new CertificateGenerationError(
      message,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      "AUTHENTICATION_ERROR",
      context,
      false,
      undefined,
      originalError,
    );
  }

  /**
   * Create authorization error
   */
  static authorizationError(
    message: string,
    context: ErrorContext = {},
    originalError?: Error,
  ): CertificateGenerationError {
    return new CertificateGenerationError(
      message,
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.HIGH,
      "AUTHORIZATION_ERROR",
      context,
      false,
      undefined,
      originalError,
    );
  }

  /**
   * Create rate limit error
   */
  static rateLimitError(
    message: string,
    context: ErrorContext = {},
    originalError?: Error,
  ): CertificateGenerationError {
    return new CertificateGenerationError(
      message,
      ErrorCategory.RATE_LIMIT,
      ErrorSeverity.MEDIUM,
      "RATE_LIMIT_ERROR",
      context,
      true,
      undefined,
      originalError,
    );
  }

  /**
   * Create timeout error
   */
  static timeoutError(
    message: string,
    context: ErrorContext = {},
    originalError?: Error,
  ): CertificateGenerationError {
    return new CertificateGenerationError(
      message,
      ErrorCategory.TIMEOUT,
      ErrorSeverity.MEDIUM,
      "TIMEOUT_ERROR",
      context,
      true,
      undefined,
      originalError,
    );
  }

  /**
   * Create memory error
   */
  static memoryError(
    message: string,
    context: ErrorContext = {},
    originalError?: Error,
  ): CertificateGenerationError {
    return new CertificateGenerationError(
      message,
      ErrorCategory.MEMORY,
      ErrorSeverity.HIGH,
      "MEMORY_ERROR",
      context,
      true,
      undefined,
      originalError,
    );
  }

  /**
   * Create database error
   */
  static databaseError(
    message: string,
    context: ErrorContext = {},
    originalError?: Error,
  ): CertificateGenerationError {
    return new CertificateGenerationError(
      message,
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      "DATABASE_ERROR",
      context,
      true,
      undefined,
      originalError,
    );
  }

  /**
   * Create template error
   */
  static templateError(
    message: string,
    context: ErrorContext = {},
    originalError?: Error,
  ): CertificateGenerationError {
    return new CertificateGenerationError(
      message,
      ErrorCategory.TEMPLATE,
      ErrorSeverity.MEDIUM,
      "TEMPLATE_ERROR",
      context,
      false,
      undefined,
      originalError,
    );
  }

  /**
   * Create PDF generation error
   */
  static pdfGenerationError(
    message: string,
    context: ErrorContext = {},
    originalError?: Error,
  ): CertificateGenerationError {
    return new CertificateGenerationError(
      message,
      ErrorCategory.PDF_GENERATION,
      ErrorSeverity.MEDIUM,
      "PDF_GENERATION_ERROR",
      context,
      true,
      undefined,
      originalError,
    );
  }

  /**
   * Create unknown error
   */
  static unknownError(
    message: string,
    context: ErrorContext = {},
    originalError?: Error,
  ): CertificateGenerationError {
    return new CertificateGenerationError(
      message,
      ErrorCategory.UNKNOWN,
      ErrorSeverity.CRITICAL,
      "UNKNOWN_ERROR",
      context,
      false,
      undefined,
      originalError,
    );
  }
}

/**
 * Error logger for comprehensive error tracking
 */
export class CertificateErrorLogger {
  /**
   * Log error with full context
   */
  static async logError(
    error: CertificateGenerationError,
    additionalContext: Record<string, any> = {},
  ): Promise<void> {
    try {
      // Get system information
      const systemInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      };

      // Get memory usage percentage
      const memoryUsage = process.memoryUsage();
      const memoryPercentage =
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

      // Enhanced error context
      const enhancedContext = {
        ...error.context,
        ...additionalContext,
        systemInfo,
        memoryUsage: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          percentage: memoryPercentage,
        },
        errorId: this.generateErrorId(),
        timestamp: error.timestamp.toISOString(),
      };

      // Log to console with structured format
      try {
        console.error("Certificate Generation Error:", {
          error: error.toJSON(),
          context: enhancedContext,
        });
      } catch (consoleError) {
        // Don't fail if console.error throws
        console.warn("Failed to log error to console:", consoleError);
      }

      // Log to audit system if we have entity context
      if (error.context.entityId) {
        try {
          await AuditLogger.logCertificateGenerated(
            error.context.entityId,
            error.context.userId || "system",
            error.context.transactionId || "unknown",
            error.context.templateId || "unknown",
            error.context.format || "PDF",
            error.context.certificateNumber || "unknown",
            0, // fileSize
            "error", // checksum
            {
              error: true,
              errorCategory: error.category,
              errorSeverity: error.severity,
              errorCode: error.code,
              errorMessage: error.message,
              userMessage: error.userMessage,
              isRetryable: error.isRetryable,
              retryCount: error.context.retryCount || 0,
              memoryUsage: enhancedContext.memoryUsage,
              systemInfo: enhancedContext.systemInfo,
              ...additionalContext,
            },
          );
        } catch (auditError) {
          console.error("Failed to log error to audit system:", auditError);
        }
      }

      // TODO: Send to external monitoring system (e.g., Sentry, DataDog)
      // This would be implemented based on the monitoring service used
      await this.sendToMonitoringSystem(error, enhancedContext);
    } catch (loggingError) {
      console.error("Failed to log certificate error:", loggingError);
    }
  }

  /**
   * Generate unique error ID
   */
  private static generateErrorId(): string {
    return `cert-error-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  /**
   * Send error to monitoring system
   */
  private static async sendToMonitoringSystem(
    error: CertificateGenerationError,
    context: Record<string, any>,
  ): Promise<void> {
    // TODO: Implement monitoring system integration
    // Example for Sentry:
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(error, {
    //     tags: {
    //       category: error.category,
    //       severity: error.severity,
    //       code: error.code,
    //     },
    //     extra: context,
    //   });
    // }

    // For now, just log that we would send to monitoring
    if (
      error.severity === ErrorSeverity.CRITICAL ||
      error.severity === ErrorSeverity.HIGH
    ) {
      console.warn("High severity error - would send to monitoring system:", {
        error: error.toJSON(),
        context,
      });
    }
  }
}

/**
 * Error recovery manager for handling retryable errors
 */
export class CertificateErrorRecovery {
  private static readonly maxRetries = 3;
  private static readonly retryDelays = [1000, 2000, 5000]; // Delays in milliseconds
  private static readonly testRetryDelays = [10, 20, 50]; // Much shorter delays for tests

  /**
   * Attempt to recover from error with retry logic
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries: number = this.maxRetries,
  ): Promise<T> {
    let lastError: CertificateGenerationError | null = null;

    // Use shorter delays in test environment
    const delays =
      process.env.NODE_ENV === "test" ? this.testRetryDelays : this.retryDelays;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const certError = this.normalizeError(error, {
          ...context,
          retryCount: attempt,
        });

        // Log the error
        try {
          await CertificateErrorLogger.logError(certError, {
            attempt,
            maxRetries,
          });
        } catch (loggingError) {
          // Don't fail retry logic if logging fails
          console.error("Failed to log error during retry:", loggingError);
        }

        // If not retryable or max retries reached, throw
        if (!certError.isRetryable || attempt === maxRetries) {
          throw certError;
        }

        lastError = certError;

        // Wait before retry
        const delay = delays[attempt] || delays[delays.length - 1];
        await this.sleep(delay);
      }
    }

    throw (
      lastError ||
      CertificateErrorFactory.unknownError("Max retries exceeded", context)
    );
  }

  /**
   * Normalize any error to CertificateGenerationError
   */
  private static normalizeError(
    error: any,
    context: ErrorContext,
  ): CertificateGenerationError {
    if (error instanceof CertificateGenerationError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);

    // Categorize based on error message or type
    if (
      message.toLowerCase().includes("timeout") ||
      message.toLowerCase().includes("timed out")
    ) {
      return CertificateErrorFactory.timeoutError(
        message,
        context,
        error instanceof Error ? error : undefined,
      );
    }

    if (
      message.toLowerCase().includes("memory") ||
      message.toLowerCase().includes("heap")
    ) {
      return CertificateErrorFactory.memoryError(
        message,
        context,
        error instanceof Error ? error : undefined,
      );
    }

    if (
      message.toLowerCase().includes("network") ||
      message.toLowerCase().includes("fetch") ||
      message.toLowerCase().includes("http")
    ) {
      return CertificateErrorFactory.networkError(
        message,
        context,
        error instanceof Error ? error : undefined,
      );
    }

    if (
      message.toLowerCase().includes("database") ||
      message.toLowerCase().includes("prisma") ||
      message.toLowerCase().includes("connection")
    ) {
      return CertificateErrorFactory.databaseError(
        message,
        context,
        error instanceof Error ? error : undefined,
      );
    }

    if (
      message.toLowerCase().includes("template") ||
      message.toLowerCase().includes("validation")
    ) {
      return CertificateErrorFactory.templateError(
        message,
        context,
        error instanceof Error ? error : undefined,
      );
    }

    if (
      message.toLowerCase().includes("pdf") ||
      message.toLowerCase().includes("puppeteer") ||
      message.toLowerCase().includes("browser")
    ) {
      return CertificateErrorFactory.pdfGenerationError(
        message,
        context,
        error instanceof Error ? error : undefined,
      );
    }

    return CertificateErrorFactory.unknownError(
      message,
      context,
      error instanceof Error ? error : undefined,
    );
  }

  /**
   * Sleep utility
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Error response formatter for API responses
 */
export class CertificateErrorResponse {
  /**
   * Format error for API response
   */
  static formatError(error: CertificateGenerationError): {
    success: false;
    error: string;
    errorCode: string;
    errorCategory: string;
    errorDetails?: Record<string, any>;
    retryable: boolean;
    retryAfter?: number;
  } {
    const response: any = {
      success: false,
      error: error.userMessage,
      errorCode: error.code,
      errorCategory: error.category,
      retryable: error.isRetryable,
    };

    // Add retry information for retryable errors
    if (error.isRetryable) {
      response.retryAfter = this.getRetryDelay(error.context.retryCount || 0);
    }

    // Add additional details for development/debugging
    if (process.env.NODE_ENV === "development") {
      response.errorDetails = {
        originalMessage: error.message,
        stack: error.stack,
        context: error.context,
      };
    }

    return response;
  }

  /**
   * Get retry delay based on retry count
   */
  private static getRetryDelay(retryCount: number): number {
    const delays = [1000, 2000, 5000];
    return delays[retryCount] || delays[delays.length - 1];
  }
}
