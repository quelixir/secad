"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  FileText,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EntitySettings, EntitySettingsResponse } from "@/lib/types/interfaces";

interface CertificateSettingsProps {
  entityId: string;
}

export function CertificateSettings({ entityId }: CertificateSettingsProps) {
  const [settings, setSettings] = useState<EntitySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, [entityId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/entities/${entityId}/settings`);
      const result: EntitySettingsResponse = await response.json();

      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        setError(result.error || "Failed to fetch settings");
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("An unexpected error occurred while fetching settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChange = async (enabled: boolean) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/entities/${entityId}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          certificatesEnabled: enabled,
        }),
      });

      const result: EntitySettingsResponse = await response.json();

      if (result.success && result.data) {
        setSettings(result.data);
        setSuccess(
          `Certificates ${enabled ? "enabled" : "disabled"} successfully`
        );

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || "Failed to update settings");
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      setError("An unexpected error occurred while updating settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Certificate Settings
          </CardTitle>
          <CardDescription>
            Configure certificate generation for this entity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Loading settings...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Certificate Settings
        </CardTitle>
        <CardDescription>
          Configure certificate generation for this entity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success Alert */}
        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Certificate Toggle */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label
              htmlFor="certificates-enabled"
              className="text-base font-medium"
            >
              Enable Certificates
            </Label>
            <div className="text-sm text-muted-foreground">
              Allow generation of certificates for securities transactions
            </div>
            <div className="text-sm text-muted-foreground">
              Certificates are currently{" "}
              <span
                className={cn(
                  "font-medium",
                  settings?.certificatesEnabled
                    ? "text-green-600"
                    : "text-red-600"
                )}
              >
                {settings?.certificatesEnabled ? "enabled" : "disabled"}
              </span>{" "}
              for this entity.
            </div>
          </div>
          <Switch
            id="certificates-enabled"
            checked={settings?.certificatesEnabled ?? false}
            onCheckedChange={handleToggleChange}
            disabled={saving}
          />
        </div>

        {/* Help Information */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium">About Certificates</h4>
              <div className="text-sm text-muted-foreground">
                <p>
                  Certificates are official documents that serve as proof of
                  ownership for securities. When enabled, certificates can be
                  generated for securities transactions and are available
                  on-demand to users with appropriate access permissions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
