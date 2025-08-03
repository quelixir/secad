import {
  CertificateGenerationError,
  CertificateErrorFactory,
  CertificateErrorLogger,
  CertificateErrorRecovery,
  CertificateErrorResponse,
  ErrorCategory,
  ErrorSeverity,
  ErrorContext,
} from "./error-handling";

// Mock the audit logger
jest.mock("@/lib/audit", () => ({
  AuditLogger: {
    logCertificateGenerated: jest.fn().mockResolvedValue(undefined),
  },
}));

describe("Certificate Error Handling", () => {
  describe("CertificateGenerationError", () => {
    it("should create error with default user message", () => {
      const error = new CertificateGenerationError(
        "Test error message",
        ErrorCategory.VALIDATION,
        ErrorSeverity.MEDIUM,
        "TEST_ERROR",
        { transactionId: "ec83rv0fkh1zvqhs624zpcg4" },
        false,
      );

      expect(error.message).toBe("Test error message");
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.code).toBe("TEST_ERROR");
      expect(error.context.transactionId).toBe("ec83rv0fkh1zvqhs624zpcg4");
      expect(error.isRetryable).toBe(false);
      expect(error.userMessage).toBe(
        "The certificate data is invalid. Please check the information and try again.",
      );
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it("should create error with custom user message", () => {
      const error = new CertificateGenerationError(
        "Test error message",
        ErrorCategory.SYSTEM,
        ErrorSeverity.HIGH,
        "TEST_ERROR",
        { transactionId: "ec83rv0fkh1zvqhs624zpcg4" },
        true,
        "Custom user message",
      );

      expect(error.userMessage).toBe("Custom user message");
      expect(error.isRetryable).toBe(true);
    });

    it("should convert to JSON correctly", () => {
      const originalError = new Error("Original error");
      const error = new CertificateGenerationError(
        "Test error message",
        ErrorCategory.VALIDATION,
        ErrorSeverity.MEDIUM,
        "TEST_ERROR",
        { transactionId: "ec83rv0fkh1zvqhs624zpcg4" },
        false,
        undefined,
        originalError,
      );

      const json = error.toJSON();
      expect(json.name).toBe("CertificateGenerationError");
      expect(json.message).toBe("Test error message");
      expect(json.category).toBe(ErrorCategory.VALIDATION);
      expect(json.severity).toBe(ErrorSeverity.MEDIUM);
      expect(json.code).toBe("TEST_ERROR");
      expect(json.context.transactionId).toBe("ec83rv0fkh1zvqhs624zpcg4");
      expect(json.isRetryable).toBe(false);
      expect(json.timestamp).toBeDefined();
      expect(json.originalError).toBeDefined();
      expect(json.originalError.name).toBe("Error");
      expect(json.originalError.message).toBe("Original error");
    });
  });

  describe("CertificateErrorFactory", () => {
    const context: ErrorContext = {
      transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      entityId: "d5vaqv2ed5pb3gulopy9z5ao",
      userId: "user-789",
    };

    it("should create validation error", () => {
      const error = CertificateErrorFactory.validationError(
        "Validation failed",
        context,
      );

      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.isRetryable).toBe(false);
      expect(error.context).toEqual(context);
    });

    it("should create system error", () => {
      const error = CertificateErrorFactory.systemError(
        "System error",
        context,
      );

      expect(error.category).toBe(ErrorCategory.SYSTEM);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.code).toBe("SYSTEM_ERROR");
      expect(error.isRetryable).toBe(true);
      expect(error.context).toEqual(context);
    });

    it("should create network error", () => {
      const error = CertificateErrorFactory.networkError(
        "Network error",
        context,
      );

      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.isRetryable).toBe(true);
      expect(error.context).toEqual(context);
    });

    it("should create authentication error", () => {
      const error = CertificateErrorFactory.authenticationError(
        "Auth error",
        context,
      );

      expect(error.category).toBe(ErrorCategory.AUTHENTICATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.code).toBe("AUTHENTICATION_ERROR");
      expect(error.isRetryable).toBe(false);
      expect(error.context).toEqual(context);
    });

    it("should create authorization error", () => {
      const error = CertificateErrorFactory.authorizationError(
        "Authz error",
        context,
      );

      expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.code).toBe("AUTHORIZATION_ERROR");
      expect(error.isRetryable).toBe(false);
      expect(error.context).toEqual(context);
    });

    it("should create rate limit error", () => {
      const error = CertificateErrorFactory.rateLimitError(
        "Rate limit exceeded",
        context,
      );

      expect(error.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.code).toBe("RATE_LIMIT_ERROR");
      expect(error.isRetryable).toBe(true);
      expect(error.context).toEqual(context);
    });

    it("should create timeout error", () => {
      const error = CertificateErrorFactory.timeoutError(
        "Request timeout",
        context,
      );

      expect(error.category).toBe(ErrorCategory.TIMEOUT);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.code).toBe("TIMEOUT_ERROR");
      expect(error.isRetryable).toBe(true);
      expect(error.context).toEqual(context);
    });

    it("should create memory error", () => {
      const error = CertificateErrorFactory.memoryError(
        "Memory error",
        context,
      );

      expect(error.category).toBe(ErrorCategory.MEMORY);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.code).toBe("MEMORY_ERROR");
      expect(error.isRetryable).toBe(true);
      expect(error.context).toEqual(context);
    });

    it("should create database error", () => {
      const error = CertificateErrorFactory.databaseError(
        "Database error",
        context,
      );

      expect(error.category).toBe(ErrorCategory.DATABASE);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.code).toBe("DATABASE_ERROR");
      expect(error.isRetryable).toBe(true);
      expect(error.context).toEqual(context);
    });

    it("should create template error", () => {
      const error = CertificateErrorFactory.templateError(
        "Template error",
        context,
      );

      expect(error.category).toBe(ErrorCategory.TEMPLATE);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.code).toBe("TEMPLATE_ERROR");
      expect(error.isRetryable).toBe(false);
      expect(error.context).toEqual(context);
    });

    it("should create PDF generation error", () => {
      const error = CertificateErrorFactory.pdfGenerationError(
        "PDF generation error",
        context,
      );

      expect(error.category).toBe(ErrorCategory.PDF_GENERATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.code).toBe("PDF_GENERATION_ERROR");
      expect(error.isRetryable).toBe(true);
      expect(error.context).toEqual(context);
    });

    it("should create unknown error", () => {
      const error = CertificateErrorFactory.unknownError(
        "Unknown error",
        context,
      );

      expect(error.category).toBe(ErrorCategory.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
      expect(error.code).toBe("UNKNOWN_ERROR");
      expect(error.isRetryable).toBe(false);
      expect(error.context).toEqual(context);
    });
  });

  describe("CertificateErrorLogger", () => {
    let originalConsoleError: typeof console.error;
    let originalConsoleWarn: typeof console.warn;

    beforeEach(() => {
      jest.clearAllMocks();
      originalConsoleError = console.error;
      originalConsoleWarn = console.warn;
      console.error = jest.fn();
      console.warn = jest.fn();
    });

    afterEach(() => {
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    });

    it("should log error with full context", async () => {
      const error = CertificateErrorFactory.validationError("Test error", {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      });

      await CertificateErrorLogger.logError(error, { additional: "context" });

      expect(console.error).toHaveBeenCalledWith(
        "Certificate Generation Error:",
        expect.objectContaining({
          error: expect.objectContaining({
            name: "CertificateGenerationError",
            message: "Test error",
            category: ErrorCategory.VALIDATION,
          }),
          context: expect.objectContaining({
            transactionId: "ec83rv0fkh1zvqhs624zpcg4",
            additional: "context",
            systemInfo: expect.any(Object),
            memoryUsage: expect.any(Object),
            errorId: expect.stringMatching(/cert-error-\d+-/),
          }),
        }),
      );
    });

    it("should log high severity errors to monitoring", async () => {
      const error = CertificateErrorFactory.systemError(
        "Critical system error",
        { transactionId: "ec83rv0fkh1zvqhs624zpcg4" },
      );

      await CertificateErrorLogger.logError(error);

      expect(console.warn).toHaveBeenCalledWith(
        "High severity error - would send to monitoring system:",
        expect.objectContaining({
          error: expect.any(Object),
          context: expect.any(Object),
        }),
      );
    });

    it("should handle logging errors gracefully", async () => {
      const error = CertificateErrorFactory.validationError("Test error");

      // Mock console.error to throw
      const mockConsoleError = jest.fn().mockImplementation(() => {
        throw new Error("Console error");
      });
      console.error = mockConsoleError;

      // Should not throw
      await expect(
        CertificateErrorLogger.logError(error),
      ).resolves.toBeUndefined();

      // Restore original
      console.error = originalConsoleError;
    });
  });

  describe("CertificateErrorRecovery", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should execute operation successfully on first try", async () => {
      const operation = jest.fn().mockResolvedValue("success");
      const context: ErrorContext = {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      };

      const result = await CertificateErrorRecovery.withRetry(
        operation,
        context,
      );

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should retry on retryable errors", async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error("Network timeout"))
        .mockResolvedValueOnce("success");
      const context: ErrorContext = {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      };

      const result = await CertificateErrorRecovery.withRetry(
        operation,
        context,
      );

      expect(result).toBe("success");
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it("should not retry on non-retryable errors", async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new Error("Validation failed"));
      const context: ErrorContext = {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      };

      await expect(
        CertificateErrorRecovery.withRetry(operation, context),
      ).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should stop retrying after max attempts", async () => {
      const operation = jest
        .fn()
        .mockRejectedValue(new Error("Network timeout"));
      const context: ErrorContext = {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      };

      await expect(
        CertificateErrorRecovery.withRetry(operation, context, 2),
      ).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it("should normalize different error types", async () => {
      const operation = jest.fn().mockRejectedValue("String error");
      const context: ErrorContext = {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      };

      await expect(
        CertificateErrorRecovery.withRetry(operation, context),
      ).rejects.toThrow();

      expect(operation).toHaveBeenCalledTimes(1);
    });

    it("should preserve CertificateGenerationError", async () => {
      const certError =
        CertificateErrorFactory.validationError("Validation failed");
      const operation = jest.fn().mockRejectedValue(certError);
      const context: ErrorContext = {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      };

      await expect(
        CertificateErrorRecovery.withRetry(operation, context),
      ).rejects.toThrow(certError);

      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe("CertificateErrorResponse", () => {
    it("should format error for API response", () => {
      const error = CertificateErrorFactory.validationError(
        "Validation failed",
        { transactionId: "ec83rv0fkh1zvqhs624zpcg4", retryCount: 0 },
      );

      const response = CertificateErrorResponse.formatError(error);

      expect(response).toEqual({
        success: false,
        error:
          "The certificate data is invalid. Please check the information and try again.",
        errorCode: "VALIDATION_ERROR",
        errorCategory: "validation",
        retryable: false,
      });
    });

    it("should include retry information for retryable errors", () => {
      const error = CertificateErrorFactory.systemError("System error", {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
        retryCount: 1,
      });

      const response = CertificateErrorResponse.formatError(error);

      expect(response).toEqual({
        success: false,
        error: "A system error occurred. Please try again later.",
        errorCode: "SYSTEM_ERROR",
        errorCategory: "system",
        retryable: true,
        retryAfter: 2000,
      });
    });

    it("should include debug details in development", () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "development",
        writable: true,
      });

      const error = CertificateErrorFactory.validationError(
        "Validation failed",
        { transactionId: "ec83rv0fkh1zvqhs624zpcg4" },
      );

      const response = CertificateErrorResponse.formatError(error);

      expect(response.errorDetails).toBeDefined();
      expect(response.errorDetails?.originalMessage).toBe("Validation failed");
      expect(response.errorDetails?.context).toEqual({
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      });

      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalEnv,
        writable: true,
      });
    });

    it("should not include debug details in production", () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        writable: true,
      });

      const error = CertificateErrorFactory.validationError(
        "Validation failed",
        { transactionId: "ec83rv0fkh1zvqhs624zpcg4" },
      );

      const response = CertificateErrorResponse.formatError(error);

      expect(response.errorDetails).toBeUndefined();

      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalEnv,
        writable: true,
      });
    });
  });

  describe("Error categorization", () => {
    it("should categorize timeout errors correctly", () => {
      const context: ErrorContext = {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      };

      const error1 = CertificateErrorRecovery["normalizeError"](
        new Error("Request timeout"),
        context,
      );
      expect(error1.category).toBe(ErrorCategory.TIMEOUT);

      const error2 = CertificateErrorRecovery["normalizeError"](
        new Error("Operation timed out"),
        context,
      );
      expect(error2.category).toBe(ErrorCategory.TIMEOUT);
    });

    it("should categorize memory errors correctly", () => {
      const context: ErrorContext = {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      };

      const error1 = CertificateErrorRecovery["normalizeError"](
        new Error("Memory allocation failed"),
        context,
      );
      expect(error1.category).toBe(ErrorCategory.MEMORY);

      const error2 = CertificateErrorRecovery["normalizeError"](
        new Error("Heap out of memory"),
        context,
      );
      expect(error2.category).toBe(ErrorCategory.MEMORY);
    });

    it("should categorize database errors correctly", () => {
      const context: ErrorContext = {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      };

      const error1 = CertificateErrorRecovery["normalizeError"](
        new Error("Database connection failed"),
        context,
      );
      expect(error1.category).toBe(ErrorCategory.DATABASE);

      const error2 = CertificateErrorRecovery["normalizeError"](
        new Error("Prisma query failed"),
        context,
      );
      expect(error2.category).toBe(ErrorCategory.DATABASE);
    });

    it("should categorize network errors correctly", () => {
      const context: ErrorContext = {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      };

      const error1 = CertificateErrorRecovery["normalizeError"](
        new Error("Network connection failed"),
        context,
      );
      expect(error1.category).toBe(ErrorCategory.NETWORK);

      const error2 = CertificateErrorRecovery["normalizeError"](
        new Error("HTTP request failed"),
        context,
      );
      expect(error2.category).toBe(ErrorCategory.NETWORK);
    });

    it("should categorize template errors correctly", () => {
      const context: ErrorContext = {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      };

      const error1 = CertificateErrorRecovery["normalizeError"](
        new Error("Template validation failed"),
        context,
      );
      expect(error1.category).toBe(ErrorCategory.TEMPLATE);

      const error2 = CertificateErrorRecovery["normalizeError"](
        new Error("Template not found"),
        context,
      );
      expect(error2.category).toBe(ErrorCategory.TEMPLATE);
    });

    it("should categorize PDF generation errors correctly", () => {
      const context: ErrorContext = {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      };

      const error1 = CertificateErrorRecovery["normalizeError"](
        new Error("PDF generation failed"),
        context,
      );
      expect(error1.category).toBe(ErrorCategory.PDF_GENERATION);

      const error2 = CertificateErrorRecovery["normalizeError"](
        new Error("Puppeteer browser error"),
        context,
      );
      expect(error2.category).toBe(ErrorCategory.PDF_GENERATION);
    });

    it("should categorize unknown errors correctly", () => {
      const context: ErrorContext = {
        transactionId: "ec83rv0fkh1zvqhs624zpcg4",
      };

      const error = CertificateErrorRecovery["normalizeError"](
        new Error("Some random error"),
        context,
      );
      expect(error.category).toBe(ErrorCategory.UNKNOWN);
    });
  });
});
