"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Download,
  Settings,
  Hash,
  Calendar,
  Building2,
  User,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { CertificateProgressIndicator } from "@/components/ui/certificate-progress-indicator";

export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  scope: "GLOBAL" | "USER" | "ENTITY";
  scopeId?: string | null;
}

export interface CertificateGenerationOptions {
  templateId: string;
  format: "PDF" | "DOCX";
  certificateNumber?: string;
  issueDate: Date;
  includeWatermark: boolean;
  includeQRCode: boolean;
  customFields?: Record<string, string>;
}

export interface CertificateGenerationDialogProps {
  transactionId: string;
  entityId: string;
  entityName: string;
  memberName: string;
  securityClass: string;
  quantity: number;
  existingCertificateNumber?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (
    options: CertificateGenerationOptions,
  ) => Promise<{ progressId?: string; success: boolean; error?: string }>;
  trigger?: React.ReactNode;
}

export function CertificateGenerationDialog({
  transactionId,
  entityId,
  entityName,
  memberName,
  securityClass,
  quantity,
  existingCertificateNumber = "",
  isOpen,
  onOpenChange,
  onGenerate,
  trigger,
}: CertificateGenerationDialogProps) {
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [format, setFormat] = useState<"PDF" | "DOCX">("PDF");
  const [certificateNumber, setCertificateNumber] = useState<string>(
    existingCertificateNumber,
  );
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [includeWatermark, setIncludeWatermark] = useState<boolean>(true);
  const [includeQRCode, setIncludeQRCode] = useState<boolean>(true);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [scopeFilter, setScopeFilter] = useState<
    "ALL" | "GLOBAL" | "USER" | "ENTITY"
  >("ALL");
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [progressId, setProgressId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState<boolean>(false);

  // Load available templates
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen, entityId]);

  // Update certificate number when existing certificate number changes
  useEffect(() => {
    setCertificateNumber(existingCertificateNumber);
  }, [existingCertificateNumber]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/registry/certificate-templates?scopeId=${entityId}`,
      );
      const result = await response.json();

      if (result.success && result.data?.templates) {
        const availableTemplates = result.data.templates.filter(
          (t: CertificateTemplate) => t.isActive,
        );
        setTemplates(availableTemplates);

        // Select default template if available
        const defaultTemplate = availableTemplates.find(
          (t: CertificateTemplate) => t.isDefault,
        );
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate.id);
        } else if (availableTemplates.length > 0) {
          setSelectedTemplate(availableTemplates[0].id);
        }
      } else {
        setError("No certificate templates available for this entity");
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      setError("Failed to load certificate templates");
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = async () => {
    if (!selectedTemplate) return;

    try {
      setPreviewLoading(true);
      setError(null);

      const response = await fetch(
        `/api/registry/certificate-templates/${selectedTemplate}/preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionId,
            entityId,
            memberName,
            securityClass,
            quantity,
            certificateNumber: certificateNumber || "CERT-2024-0001",
            issueDate,
            customFields,
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPreviewHtml(result.data.html);
          setShowPreview(true);
        } else {
          setError("Failed to generate preview");
        }
      } else {
        setError("Failed to generate preview");
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      setError("Failed to generate preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerateClick = () => {
    if (!selectedTemplate) {
      setError("Please select a certificate template");
      return;
    }
    setShowConfirmation(true);
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) {
      setError("Please select a certificate template");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setShowProgress(false);
      setProgressId(null);

      const options: CertificateGenerationOptions = {
        templateId: selectedTemplate,
        format,
        certificateNumber: certificateNumber || undefined,
        issueDate: new Date(issueDate),
        includeWatermark,
        includeQRCode,
        customFields:
          Object.keys(customFields).length > 0 ? customFields : undefined,
      };

      const result = await onGenerate(options);

      if (result.success && result.progressId) {
        // Show progress tracking
        setProgressId(result.progressId);
        setShowProgress(true);
      } else if (result.success) {
        // Traditional success flow
        setSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
          setSuccess(false);
        }, 2000);
      } else {
        // Error flow
        setError(result.error || "Failed to generate certificate");
      }
    } catch (error) {
      console.error("Error generating certificate:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate certificate",
      );
    } finally {
      setLoading(false);
    }
  };

  const addCustomField = () => {
    const fieldName = `custom_${Object.keys(customFields).length + 1}`;
    setCustomFields((prev) => ({ ...prev, [fieldName]: "" }));
  };

  const removeCustomField = (fieldName: string) => {
    setCustomFields((prev) => {
      const newFields = { ...prev };
      delete newFields[fieldName];
      return newFields;
    });
  };

  const updateCustomField = (fieldName: string, value: string) => {
    setCustomFields((prev) => ({ ...prev, [fieldName]: value }));
  };

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate);

  // Filter templates based on scope
  const filteredTemplates = templates.filter((template) => {
    if (scopeFilter === "ALL") return true;
    return template.scope === scopeFilter;
  });

  const getScopeBadge = (scope: string) => {
    const variants = {
      GLOBAL: "default",
      USER: "secondary",
      ENTITY: "outline",
    } as const;

    return (
      <Badge
        variant={variants[scope as keyof typeof variants] || "default"}
        className="text-xs"
      >
        {scope}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="!max-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Certificate
          </DialogTitle>
          <DialogDescription>
            Configure and generate a certificate for this transaction.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Transaction Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Entity:</span>
                  <span className="text-muted-foreground">{entityName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Member:</span>
                  <span className="text-muted-foreground">{memberName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Security Class:</span>
                  <span className="text-muted-foreground">{securityClass}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Quantity:</span>
                  <span className="text-muted-foreground">
                    {quantity.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Certificate Template
              </CardTitle>
              <CardDescription>
                Select a template for the certificate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Scope Filter */}
              <div className="space-y-2">
                <Label htmlFor="scopeFilter">Filter by Scope</Label>
                <Select
                  value={scopeFilter}
                  onValueChange={(
                    value: "ALL" | "GLOBAL" | "USER" | "ENTITY",
                  ) => setScopeFilter(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Templates</SelectItem>
                    <SelectItem value="GLOBAL">Global Templates</SelectItem>
                    <SelectItem value="USER">User Templates</SelectItem>
                    <SelectItem value="ENTITY">Entity Templates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading templates...
                </div>
              ) : filteredTemplates.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No certificate templates available for the selected scope.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          <span>{template.name}</span>
                          {template.isDefault && (
                            <Badge variant="secondary" className="text-xs">
                              Default
                            </Badge>
                          )}
                          {getScopeBadge(template.scope)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedTemplateData && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplateData.description ||
                        "No description available"}
                    </p>
                  </div>

                  {/* Template Preview Button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePreview}
                    disabled={previewLoading}
                  >
                    {previewLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Preview...
                      </>
                    ) : (
                      <>
                        <Settings className="mr-2 h-4 w-4" />
                        Preview Template
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generation Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Generation Options
              </CardTitle>
              <CardDescription>
                Configure certificate generation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={format}
                    onValueChange={(value: "PDF" | "DOCX") => setFormat(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="DOCX">DOCX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueDate">Issue Date</Label>
                  <Input
                    id="issueDate"
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="certificateNumber"
                  className="flex items-center gap-2"
                >
                  Certificate Number (Optional)
                  {existingCertificateNumber && (
                    <Badge variant="secondary" className="text-xs">
                      Existing: {existingCertificateNumber}
                    </Badge>
                  )}
                </Label>
                <Input
                  id="certificateNumber"
                  placeholder={
                    existingCertificateNumber
                      ? `Current: ${existingCertificateNumber}`
                      : "Leave blank for auto-generation"
                  }
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {existingCertificateNumber
                    ? "Certificate number is pre-filled from existing data. You can modify it if needed."
                    : "If left blank, a certificate number will be automatically generated"}
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Additional Features
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="watermark"
                      checked={includeWatermark}
                      onCheckedChange={(checked) =>
                        setIncludeWatermark(checked as boolean)
                      }
                    />
                    <Label htmlFor="watermark" className="text-sm">
                      Include watermark
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="qrcode"
                      checked={includeQRCode}
                      onCheckedChange={(checked) =>
                        setIncludeQRCode(checked as boolean)
                      }
                    />
                    <Label htmlFor="qrcode" className="text-sm">
                      Include QR code
                    </Label>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Custom Fields */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Custom Fields</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCustomField}
                  >
                    Add Field
                  </Button>
                </div>

                {Object.entries(customFields).map(([fieldName, value]) => (
                  <div key={fieldName} className="flex gap-2">
                    <Input
                      placeholder="Field name"
                      value={fieldName}
                      onChange={(e) => {
                        const newFields = { ...customFields };
                        delete newFields[fieldName];
                        newFields[e.target.value] = value;
                        setCustomFields(newFields);
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Field value"
                      value={value}
                      onChange={(e) =>
                        updateCustomField(fieldName, e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCustomField(fieldName)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Error/Success Messages */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Certificate generated successfully!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerateClick}
            disabled={loading || !selectedTemplate}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate Certificate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Template Preview Modal */}
      {showPreview && (
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="!max-w-[80vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Template Preview</DialogTitle>
              <DialogDescription>
                Preview of how the certificate will look with current settings
              </DialogDescription>
            </DialogHeader>
            <div className="border rounded-md p-4 bg-white">
              <div
                className="certificate-preview"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
                style={{
                  transform: "scale(0.7)",
                  transformOrigin: "top left",
                  width: "142.86%", // 1/0.7 = 142.86%
                  height: "auto",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Certificate Generation</DialogTitle>
            <DialogDescription>
              Are you sure you want to generate a certificate with the current
              settings? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm">
              <p>
                <strong>Template:</strong> {selectedTemplateData?.name}
              </p>
              <p>
                <strong>Format:</strong> {format}
              </p>
              <p>
                <strong>Certificate Number:</strong>{" "}
                {certificateNumber || "Auto-generated"}
              </p>
              <p>
                <strong>Issue Date:</strong> {issueDate}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setShowConfirmation(false);
                await handleGenerate();
              }}
            >
              Generate Certificate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Tracking Dialog */}
      {showProgress && progressId && (
        <Dialog open={showProgress} onOpenChange={setShowProgress}>
          <DialogContent className="!max-w-[80vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Certificate Generation Progress</DialogTitle>
              <DialogDescription>
                Track the progress of your certificate generation in real-time.
              </DialogDescription>
            </DialogHeader>
            <CertificateProgressIndicator
              progressId={progressId}
              onComplete={(result) => {
                if (result.success) {
                  setShowProgress(false);
                  setSuccess(true);
                  setTimeout(() => {
                    onOpenChange(false);
                    setSuccess(false);
                  }, 2000);
                }
              }}
              onCancel={() => {
                setShowProgress(false);
                setProgressId(null);
              }}
              onError={(error) => {
                setShowProgress(false);
                setProgressId(null);
                setError(error);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
