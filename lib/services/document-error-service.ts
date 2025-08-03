import { toast } from "sonner";

// Error types for better categorization
export enum DocumentErrorType {
  NETWORK = "NETWORK",
  PERMISSION = "PERMISSION",
  VALIDATION = "VALIDATION",
  NOT_FOUND = "NOT_FOUND",
  STORAGE = "STORAGE",
  UPLOAD = "UPLOAD",
  DOWNLOAD = "DOWNLOAD",
  AUTHENTICATION = "AUTHENTICATION",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
}

// Structured error information
export interface DocumentError {
  type: DocumentErrorType;
  code?: string;
  message: string;
  originalError?: Error;
  context?: string;
  timestamp: Date;
  userMessage: string;
  actionable: boolean;
  retry?: boolean;
}

// Error patterns for automatic classification
const ERROR_PATTERNS = {
  [DocumentErrorType.NETWORK]: [
    /network/i,
    /fetch/i,
    /connection/i,
    /timeout/i,
    /offline/i,
  ],
  [DocumentErrorType.PERMISSION]: [
    /permission/i,
    /unauthorized/i,
    /forbidden/i,
    /access denied/i,
    /insufficient/i,
  ],
  [DocumentErrorType.VALIDATION]: [
    /validation/i,
    /invalid/i,
    /required/i,
    /format/i,
    /size/i,
    /type/i,
  ],
  [DocumentErrorType.NOT_FOUND]: [
    /not found/i,
    /404/i,
    /missing/i,
    /does not exist/i,
  ],
  [DocumentErrorType.STORAGE]: [
    /storage/i,
    /quota/i,
    /space/i,
    /limit/i,
    /capacity/i,
  ],
  [DocumentErrorType.UPLOAD]: [
    /upload/i,
    /file.*failed/i,
    /transfer/i,
  ],
  [DocumentErrorType.DOWNLOAD]: [
    /download/i,
    /retrieve/i,
  ],
  [DocumentErrorType.AUTHENTICATION]: [
    /auth/i,
    /session/i,
    /login/i,
    /token/i,
  ],
  [DocumentErrorType.SERVER]: [
    /server/i,
    /500/i,
    /internal/i,
    /database/i,
  ],
};

// User-friendly error messages
const ERROR_MESSAGES = {
  [DocumentErrorType.NETWORK]: {
    message: "Network connection error. Please check your internet connection and try again.",
    actionable: true,
    retry: true,
  },
  [DocumentErrorType.PERMISSION]: {
    message: "You don't have permission to perform this action. Contact your administrator if you need access.",
    actionable: false,
    retry: false,
  },
  [DocumentErrorType.VALIDATION]: {
    message: "The provided information is invalid. Please check your input and try again.",
    actionable: true,
    retry: true,
  },
  [DocumentErrorType.NOT_FOUND]: {
    message: "The requested document could not be found. It may have been moved or deleted.",
    actionable: false,
    retry: false,
  },
  [DocumentErrorType.STORAGE]: {
    message: "Storage limit exceeded. Please free up space or contact your administrator.",
    actionable: true,
    retry: false,
  },
  [DocumentErrorType.UPLOAD]: {
    message: "File upload failed. Please check the file and try again.",
    actionable: true,
    retry: true,
  },
  [DocumentErrorType.DOWNLOAD]: {
    message: "File download failed. Please try again or contact support if the problem persists.",
    actionable: true,
    retry: true,
  },
  [DocumentErrorType.AUTHENTICATION]: {
    message: "Authentication error. Please log in again.",
    actionable: true,
    retry: false,
  },
  [DocumentErrorType.SERVER]: {
    message: "Server error occurred. Please try again later or contact support if the problem persists.",
    actionable: true,
    retry: true,
  },
  [DocumentErrorType.UNKNOWN]: {
    message: "An unexpected error occurred. Please try again or contact support if the problem persists.",
    actionable: true,
    retry: true,
  },
};

class DocumentErrorService {
  private errorLog: DocumentError[] = [];
  private maxLogSize = 100;

  /**
   * Classify error based on message patterns
   */
  private classifyError(error: Error | string): DocumentErrorType {
    const message = typeof error === 'string' ? error : error.message;
    
    for (const [type, patterns] of Object.entries(ERROR_PATTERNS)) {
      if (patterns.some(pattern => pattern.test(message))) {
        return type as DocumentErrorType;
      }
    }
    
    return DocumentErrorType.UNKNOWN;
  }

  /**
   * Create structured error from raw error
   */
  private createDocumentError(
    error: Error | string,
    context?: string,
    type?: DocumentErrorType
  ): DocumentError {
    const originalError = error instanceof Error ? error : new Error(error);
    const errorType = type || this.classifyError(originalError);
    const errorInfo = ERROR_MESSAGES[errorType];
    
    return {
      type: errorType,
      message: originalError.message,
      originalError,
      context,
      timestamp: new Date(),
      userMessage: errorInfo.message,
      actionable: errorInfo.actionable,
      retry: errorInfo.retry,
    };
  }

  /**
   * Handle error with appropriate user feedback
   */
  handleError(
    error: Error | string,
    context?: string,
    type?: DocumentErrorType,
    options: {
      showToast?: boolean;
      logError?: boolean;
      throwError?: boolean;
    } = {}
  ): DocumentError {
    const {
      showToast = true,
      logError = true,
      throwError = false,
    } = options;

    const documentError = this.createDocumentError(error, context, type);

    // Log error
    if (logError) {
      this.logError(documentError);
    }

    // Show user feedback
    if (showToast) {
      this.showErrorToast(documentError);
    }

    // Throw error if requested
    if (throwError) {
      throw documentError.originalError;
    }

    return documentError;
  }

  /**
   * Handle network errors specifically
   */
  handleNetworkError(error: Error | string, context?: string): DocumentError {
    return this.handleError(error, context, DocumentErrorType.NETWORK);
  }

  /**
   * Handle validation errors specifically
   */
  handleValidationError(error: Error | string, context?: string): DocumentError {
    return this.handleError(error, context, DocumentErrorType.VALIDATION);
  }

  /**
   * Handle permission errors specifically
   */
  handlePermissionError(error: Error | string, context?: string): DocumentError {
    return this.handleError(error, context, DocumentErrorType.PERMISSION);
  }

  /**
   * Handle upload errors specifically
   */
  handleUploadError(error: Error | string, context?: string): DocumentError {
    return this.handleError(error, context, DocumentErrorType.UPLOAD);
  }

  /**
   * Handle download errors specifically
   */
  handleDownloadError(error: Error | string, context?: string): DocumentError {
    return this.handleError(error, context, DocumentErrorType.DOWNLOAD);
  }

  /**
   * Show appropriate toast message based on error type
   */
  private showErrorToast(error: DocumentError): void {
    const toastOptions = {
      duration: error.retry ? 5000 : 4000,
    };

    switch (error.type) {
      case DocumentErrorType.NETWORK:
        toast.error(error.userMessage, toastOptions);
        break;
      case DocumentErrorType.PERMISSION:
        toast.error(error.userMessage, toastOptions);
        break;
      case DocumentErrorType.VALIDATION:
        toast.error(error.userMessage, toastOptions);
        break;
      case DocumentErrorType.NOT_FOUND:
        toast.error(error.userMessage, toastOptions);
        break;
      case DocumentErrorType.STORAGE:
        toast.error(error.userMessage, toastOptions);
        break;
      case DocumentErrorType.UPLOAD:
        toast.error(error.userMessage, toastOptions);
        break;
      case DocumentErrorType.DOWNLOAD:
        toast.error(error.userMessage, toastOptions);
        break;
      case DocumentErrorType.AUTHENTICATION:
        toast.error(error.userMessage, toastOptions);
        break;
      case DocumentErrorType.SERVER:
        toast.error(error.userMessage, toastOptions);
        break;
      default:
        toast.error(error.userMessage, toastOptions);
    }
  }

  /**
   * Log error for debugging and monitoring
   */
  private logError(error: DocumentError): void {
    // Console logging for development
    console.error(
      `[DocumentError:${error.type}] ${error.message}`,
      {
        context: error.context,
        timestamp: error.timestamp,
        originalError: error.originalError,
      }
    );

    // Add to in-memory log
    this.errorLog.unshift(error);
    
    // Trim log to prevent memory issues
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }

    // In production, you could send errors to an external service
    // this.sendToErrorTracking(error);
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit = 10): DocumentError[] {
    return this.errorLog.slice(0, limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<DocumentErrorType, number> {
    const stats = Object.values(DocumentErrorType).reduce((acc, type) => {
      acc[type] = 0;
      return acc;
    }, {} as Record<DocumentErrorType, number>);

    this.errorLog.forEach(error => {
      stats[error.type]++;
    });

    return stats;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: DocumentError): boolean {
    return error.retry === true;
  }

  /**
   * Check if error is actionable by user
   */
  isActionable(error: DocumentError): boolean {
    return error.actionable === true;
  }
}

// Export singleton instance
export const documentErrorService = new DocumentErrorService();

// Export convenience functions
export const handleDocumentError = (
  error: Error | string,
  context?: string,
  type?: DocumentErrorType,
  options?: Parameters<DocumentErrorService['handleError']>[3]
) => documentErrorService.handleError(error, context, type, options);

export const handleNetworkError = (error: Error | string, context?: string) =>
  documentErrorService.handleNetworkError(error, context);

export const handleValidationError = (error: Error | string, context?: string) =>
  documentErrorService.handleValidationError(error, context);

export const handlePermissionError = (error: Error | string, context?: string) =>
  documentErrorService.handlePermissionError(error, context);

export const handleUploadError = (error: Error | string, context?: string) =>
  documentErrorService.handleUploadError(error, context);

export const handleDownloadError = (error: Error | string, context?: string) =>
  documentErrorService.handleDownloadError(error, context);