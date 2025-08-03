"use client";

import { useState, useCallback } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  CheckCircle, 
  X, 
  AlertTriangle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { validateFile, validateFiles, type FileValidationResult } from "@/lib/validation/file-validation";

// Validation result display component
interface ValidationResultProps {
  result: FileValidationResult;
  fileName: string;
  onDismiss?: () => void;
  showWarnings?: boolean;
}

export function ValidationResult({ 
  result, 
  fileName, 
  onDismiss,
  showWarnings = true 
}: ValidationResultProps) {
  if (result.isValid && result.warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Errors */}
      {result.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium mb-1">
                  Validation errors for "{fileName}":
                </div>
                <ul className="text-sm space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-destructive">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-6 w-6 p-0 ml-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {showWarnings && result.warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium mb-1">
                  Warnings for "{fileName}":
                </div>
                <ul className="text-sm space-y-1">
                  {result.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-orange-600">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="h-6 w-6 p-0 ml-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Bulk validation results component
interface BulkValidationResultsProps {
  results: { file: File; result: FileValidationResult }[];
  globalErrors?: string[];
  onDismiss?: () => void;
  onFixableErrorsOnly?: boolean;
}

export function BulkValidationResults({ 
  results, 
  globalErrors = [],
  onDismiss,
  onFixableErrorsOnly = false 
}: BulkValidationResultsProps) {
  const hasErrors = globalErrors.length > 0 || results.some(r => !r.result.isValid);
  const hasWarnings = results.some(r => r.result.warnings.length > 0);

  if (!hasErrors && !hasWarnings) {
    return null;
  }

  const validFiles = results.filter(r => r.result.isValid);
  const invalidFiles = results.filter(r => !r.result.isValid);
  const filesWithWarnings = results.filter(r => r.result.warnings.length > 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Alert variant={hasErrors ? "destructive" : "default"}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-medium mb-2">Validation Summary</div>
              <div className="text-sm space-y-1">
                <div>✓ {validFiles.length} file{validFiles.length !== 1 ? 's' : ''} passed validation</div>
                {invalidFiles.length > 0 && (
                  <div>✗ {invalidFiles.length} file{invalidFiles.length !== 1 ? 's' : ''} failed validation</div>
                )}
                {filesWithWarnings.length > 0 && (
                  <div>⚠ {filesWithWarnings.length} file{filesWithWarnings.length !== 1 ? 's' : ''} have warnings</div>
                )}
              </div>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 w-6 p-0 ml-2"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>

      {/* Global Errors */}
      {globalErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium mb-1">Global Issues:</div>
            <ul className="text-sm space-y-1">
              {globalErrors.map((error, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-destructive">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Individual File Results */}
      {results.map(({ file, result }, index) => (
        <ValidationResult
          key={index}
          result={result}
          fileName={file.name}
          showWarnings={!onFixableErrorsOnly}
        />
      ))}
    </div>
  );
}

// Hook for file validation with state management
export function useFileValidation() {
  const [validationResults, setValidationResults] = useState<{
    file: File;
    result: FileValidationResult;
  }[]>([]);
  const [globalErrors, setGlobalErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const validateSingleFile = useCallback((file: File, options = {}) => {
    setIsValidating(true);
    try {
      const result = validateFile(file, options);
      
      if (!result.isValid) {
        toast.error(`Validation failed for ${file.name}`);
      } else if (result.warnings.length > 0) {
        toast.warning(`${file.name} has validation warnings`);
      }
      
      return result;
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Failed to validate file");
      return {
        isValid: false,
        errors: ["Validation failed due to an internal error"],
        warnings: [],
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const validateMultipleFiles = useCallback((files: File[], options = {}) => {
    setIsValidating(true);
    try {
      const validation = validateFiles(files, options);
      
      const results = files.map((file, index) => ({
        file,
        result: validation.results[index],
      }));

      setValidationResults(results);
      setGlobalErrors(validation.globalErrors);

      const validCount = results.filter(r => r.result.isValid).length;
      const invalidCount = results.length - validCount;

      if (invalidCount > 0) {
        toast.error(`${invalidCount} file${invalidCount !== 1 ? 's' : ''} failed validation`);
      } else if (validCount > 0) {
        toast.success(`All ${validCount} file${validCount !== 1 ? 's' : ''} passed validation`);
      }

      return { results, globalErrors: validation.globalErrors };
    } catch (error) {
      console.error("Bulk validation error:", error);
      toast.error("Failed to validate files");
      return {
        results: files.map(file => ({
          file,
          result: {
            isValid: false,
            errors: ["Validation failed due to an internal error"],
            warnings: [],
          },
        })),
        globalErrors: ["Bulk validation failed due to an internal error"],
      };
    } finally {
      setIsValidating(false);
    }
  }, []);

  const clearValidationResults = useCallback(() => {
    setValidationResults([]);
    setGlobalErrors([]);
  }, []);

  const getValidFiles = useCallback(() => {
    return validationResults
      .filter(r => r.result.isValid)
      .map(r => r.file);
  }, [validationResults]);

  const hasValidationErrors = globalErrors.length > 0 || 
    validationResults.some(r => !r.result.isValid);

  return {
    validationResults,
    globalErrors,
    isValidating,
    hasValidationErrors,
    validateSingleFile,
    validateMultipleFiles,
    clearValidationResults,
    getValidFiles,
  };
}

// Quick validation status indicator
export function ValidationStatus({ 
  isValid, 
  hasWarnings, 
  className = "" 
}: { 
  isValid: boolean; 
  hasWarnings: boolean; 
  className?: string; 
}) {
  if (isValid && !hasWarnings) {
    return (
      <div className={`flex items-center gap-1 text-green-600 ${className}`}>
        <CheckCircle className="h-3 w-3" />
        <span className="text-xs">Valid</span>
      </div>
    );
  }

  if (isValid && hasWarnings) {
    return (
      <div className={`flex items-center gap-1 text-orange-600 ${className}`}>
        <AlertTriangle className="h-3 w-3" />
        <span className="text-xs">Valid (warnings)</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 text-red-600 ${className}`}>
      <AlertCircle className="h-3 w-3" />
      <span className="text-xs">Invalid</span>
    </div>
  );
}

// Form field validation helper
export function FormFieldError({ 
  error, 
  className = "" 
}: { 
  error?: string; 
  className?: string; 
}) {
  if (!error) return null;

  return (
    <div className={`flex items-center gap-1 text-sm text-destructive ${className}`}>
      <AlertCircle className="h-3 w-3" />
      <span>{error}</span>
    </div>
  );
}