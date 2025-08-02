"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResolutionType,
  ResolutionStatus,
  ResolutionCategory,
  type ResolutionInput,
} from "@/lib/types";
import { Plus, FileText } from "lucide-react";

interface ResolutionFormProps {
  entityId: string;
  entityName: string;
  onSaved: () => void;
  resolution?: any; // For editing existing resolutions
}

// Standard directors' resolutions with their legislative sections and descriptions
const STANDARD_DIRECTORS_RESOLUTIONS = [
  {
    type: ResolutionType.APPOINTMENT_OF_DIRECTOR,
    title: "Appointment of Director",
    sections: "s201H, s203C",
    description:
      "Appoint a person as a director of the company via board resolution.",
  },
  {
    type: ResolutionType.RESIGNATION_OF_DIRECTOR,
    title: "Resignation of Director",
    sections: "s203A, s203C",
    description:
      "Accept the resignation of a director and update ASIC accordingly.",
  },
  {
    type: ResolutionType.REMOVAL_OF_DIRECTOR,
    title: "Removal of Director",
    sections: "s203C",
    description: "Remove a director by resolution (if constitution permits).",
  },
  {
    type: ResolutionType.APPOINTMENT_OF_COMPANY_SECRETARY,
    title: "Appointment of Company Secretary",
    sections: "s204D",
    description:
      "Appoint a company secretary, if the company chooses to have one.",
  },
  {
    type: ResolutionType.CHANGE_OF_REGISTERED_OFFICE,
    title: "Change of Registered Office",
    sections: "s142",
    description:
      "Resolve to change the company's registered office and notify ASIC.",
  },
  {
    type: ResolutionType.ISSUE_OF_SHARES,
    title: "Issue of Shares",
    sections: "s254A–s254X",
    description:
      "Approve the issue of new shares, subject to the replaceable rules or constitution.",
  },
  {
    type: ResolutionType.TRANSFER_OF_SHARES,
    title: "Transfer of Shares",
    sections: "s1071B, s1072F",
    description:
      "Approve the transfer of shares in the company, usually per constitution.",
  },
  {
    type: ResolutionType.DECLARATION_OF_DIVIDENDS,
    title: "Declaration of Dividends",
    sections: "s254U",
    description: "Resolve to declare and pay a dividend to shareholders.",
  },
  {
    type: ResolutionType.APPROVAL_OF_FINANCIAL_STATEMENTS,
    title: "Approval of Financial Statements",
    sections: "s292, s295, s296",
    description:
      "Approve the company's annual financial reports and directors' declaration.",
  },
  {
    type: ResolutionType.LODGEMENT_OF_ANNUAL_REVIEW,
    title: "Lodgement of Annual Review",
    sections: "s345",
    description:
      "Authorise the signing and lodgement of ASIC annual company statement and solvency.",
  },
  {
    type: ResolutionType.CHANGE_OF_COMPANY_NAME,
    title: "Change of Company Name",
    sections: "s157",
    description:
      "Resolve to change the company's name, subject to shareholder approval.",
  },
  {
    type: ResolutionType.CHANGE_TO_COMPANY_CONSTITUTION,
    title: "Change to Company Constitution",
    sections: "s136",
    description:
      "Approve changes to the company's constitution (if one exists), subject to shareholder resolution.",
  },
  {
    type: ResolutionType.ADOPTION_OF_A_CONSTITUTION,
    title: "Adoption of a Constitution",
    sections: "s136",
    description:
      "Adopt a constitution if the company does not already have one.",
  },
  {
    type: ResolutionType.OPENING_A_BANK_ACCOUNT,
    title: "Opening a Bank Account",
    sections: "— (common law authority)",
    description:
      "Approve the opening of a bank account and designate authorised signatories.",
  },
  {
    type: ResolutionType.EXECUTION_OF_CONTRACTS,
    title: "Execution of Contracts",
    sections: "s127",
    description:
      "Approve execution of contracts and other documents on behalf of the company.",
  },
  {
    type: ResolutionType.SOLVENCY_RESOLUTION,
    title: "Solvency Resolution",
    sections: "s347A",
    description:
      "For large proprietary companies, directors must pass a solvency resolution annually.",
  },
  {
    type: ResolutionType.LOANS_TO_DIRECTORS,
    title: "Loans to Directors",
    sections: "s208, s210, s211",
    description:
      "Approve financial benefits (including loans) to directors, ensuring compliance with related party rules.",
  },
  {
    type: ResolutionType.DIRECTORS_INTERESTS_DISCLOSURE,
    title: "Director's Interests Disclosure",
    sections: "s191",
    description:
      "Record any director's material personal interest in a matter being considered.",
  },
  {
    type: ResolutionType.CALLING_A_GENERAL_MEETING,
    title: "Calling a General Meeting",
    sections: "s249C",
    description: "Resolve to call a meeting of members/shareholders.",
  },
  {
    type: ResolutionType.DISTRIBUTION_OF_PROFITS,
    title: "Distribution of Profits",
    sections: "s254T",
    description:
      "Resolve to distribute company profits (dividends) only when the company is solvent.",
  },
  {
    type: ResolutionType.APPOINTMENT_OF_AUDITOR,
    title: "Appointment of Auditor",
    sections: "s327A",
    description:
      "Appoint an auditor if required (not mandatory for small proprietary companies).",
  },
  {
    type: ResolutionType.APPROVAL_OF_RELATED_PARTY_TRANSACTIONS,
    title: "Approval of Related Party Transactions",
    sections: "s208",
    description:
      "Approve related party transactions with proper disclosures and, if required, member approval.",
  },
  {
    type: ResolutionType.RECORD_OF_RESOLUTIONS_WITHOUT_MEETING,
    title: "Record of Resolutions Without Meeting",
    sections: "s248A",
    description:
      "Confirm that a resolution has been passed without a meeting of directors.",
  },
  {
    type: ResolutionType.GENERAL_BUSINESS,
    title: "General Business",
    sections: "—",
    description: "General business matter for board consideration.",
  },
];

interface FormData {
  entityId: string;
  category: string;
  status: string;
  title: string;
  type: string;
  description: string;
  content: string;
  resolutionDate: string;
  effectiveDate: string;
  referenceNumber: string;
  notes: string;
}

export function ResolutionForm({
  entityId,
  entityName,
  onSaved,
  resolution,
}: ResolutionFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>(
    resolution?.type || "",
  );
  const [formData, setFormData] = useState<FormData>({
    entityId,
    category: ResolutionCategory.DIRECTORS,
    status: ResolutionStatus.DRAFT,
    title: resolution?.title || "",
    type: resolution?.type || "",
    description: resolution?.description || "",
    content: resolution?.content || "",
    resolutionDate: resolution?.resolutionDate
      ? new Date(resolution.resolutionDate).toISOString().split("T")[0]
      : "",
    effectiveDate: resolution?.effectiveDate
      ? new Date(resolution.effectiveDate).toISOString().split("T")[0]
      : "",
    referenceNumber: resolution?.referenceNumber || "",
    notes: resolution?.notes || "",
  });

  // Auto-populate fields when a standard resolution type is selected
  useEffect(() => {
    if (selectedType && !resolution) {
      const standardResolution = STANDARD_DIRECTORS_RESOLUTIONS.find(
        (r) => r.type === selectedType,
      );
      if (standardResolution) {
        setFormData((prev: FormData) => ({
          ...prev,
          type: selectedType,
          title: standardResolution.title,
          description: standardResolution.description,
          content: generateResolutionContent(standardResolution, entityName),
        }));
      }
    }
  }, [selectedType, entityName, resolution]);

  const generateResolutionContent = (
    resolutionInfo: any,
    entityName: string,
  ) => {
    const currentDate = new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `DIRECTORS' RESOLUTION OF ${entityName.toUpperCase()}

Date: ${currentDate}

RESOLVED:

[Insert specific resolution details here]

This resolution relates to: ${resolutionInfo.description}

Relevant legislation: ${resolutionInfo.sections}

Signed by the directors:

_________________________    Date: ___________
Director Name

_________________________    Date: ___________
Director Name

Note: This resolution may be executed in counterparts and transmitted electronically.`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData: ResolutionInput = {
        entityId,
        title: formData.title!,
        type: formData.type!,
        category: ResolutionCategory.DIRECTORS,
        description: formData.description || undefined,
        content: formData.content!,
        status: formData.status || ResolutionStatus.DRAFT,
        resolutionDate: formData.resolutionDate
          ? new Date(formData.resolutionDate)
          : undefined,
        effectiveDate: formData.effectiveDate
          ? new Date(formData.effectiveDate)
          : undefined,
        referenceNumber: formData.referenceNumber || undefined,
        notes: formData.notes || undefined,
      };

      const url = resolution
        ? `/api/resolutions/${resolution.id}`
        : "/api/resolutions";
      const method = resolution ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        onSaved();
      } else {
        console.error("Failed to save resolution:", result.error);
        alert("Failed to save resolution: " + result.error);
      }
    } catch (error) {
      console.error("Error saving resolution:", error);
      alert("Error saving resolution");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev: FormData) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Resolution Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Resolution Type *</Label>
          <Select
            value={selectedType}
            onValueChange={(value) => {
              setSelectedType(value);
              handleInputChange("type", value);
            }}
            disabled={!!resolution}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select resolution type" />
            </SelectTrigger>
            <SelectContent>
              {STANDARD_DIRECTORS_RESOLUTIONS.map((res) => (
                <SelectItem key={res.type} value={res.type}>
                  <div className="flex flex-col">
                    <span>{res.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {res.sections}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => handleInputChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ResolutionStatus.DRAFT}>Draft</SelectItem>
              <SelectItem value={ResolutionStatus.APPROVED}>
                Approved
              </SelectItem>
              <SelectItem value={ResolutionStatus.REJECTED}>
                Rejected
              </SelectItem>
              <SelectItem value={ResolutionStatus.SUPERSEDED}>
                Superseded
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Resolution Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="Enter resolution title"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Brief description of the resolution"
          rows={2}
        />
      </div>

      {/* Resolution Content */}
      <div className="space-y-2">
        <Label htmlFor="content">Resolution Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => handleInputChange("content", e.target.value)}
          placeholder="Full text of the resolution"
          rows={12}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Resolution Date */}
        <div className="space-y-2">
          <Label htmlFor="resolutionDate">Resolution Date</Label>
          <Input
            id="resolutionDate"
            type="date"
            value={formData.resolutionDate}
            onChange={(e) =>
              handleInputChange("resolutionDate", e.target.value)
            }
          />
          <button
            type="button"
            onClick={() =>
              handleInputChange(
                "resolutionDate",
                new Date().toISOString().split("T")[0],
              )
            }
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Today
          </button>
        </div>

        {/* Effective Date */}
        <div className="space-y-2">
          <Label htmlFor="effectiveDate">Effective Date</Label>
          <Input
            id="effectiveDate"
            type="date"
            value={formData.effectiveDate}
            onChange={(e) => handleInputChange("effectiveDate", e.target.value)}
          />
          <button
            type="button"
            onClick={() =>
              handleInputChange(
                "effectiveDate",
                new Date().toISOString().split("T")[0],
              )
            }
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Today
          </button>
        </div>

        {/* Reference Number */}
        <div className="space-y-2">
          <Label htmlFor="referenceNumber">Reference Number</Label>
          <Input
            id="referenceNumber"
            value={formData.referenceNumber}
            onChange={(e) =>
              handleInputChange("referenceNumber", e.target.value)
            }
            placeholder="DR-2024-001"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          placeholder="Additional notes or comments"
          rows={3}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-2">
        <Button
          type="submit"
          disabled={loading || !formData.title || !formData.content}
        >
          {loading ? (
            <>
              <Plus className="mr-2 h-4 w-4 animate-spin" />
              {resolution ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              {resolution ? "Update Resolution" : "Create Resolution"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
