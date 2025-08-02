export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  templateHtml: string;
  templateCss?: string;
  scope: "GLOBAL" | "USER" | "ENTITY";
  scopeId?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdBy?: string; // Made optional to match test expectations
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateTemplateInput {
  name: string;
  description?: string;
  templateHtml: string;
  templateCss?: string;
  scope: "GLOBAL" | "USER" | "ENTITY";
  scopeId?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CertificateTemplateUpdateInput {
  name?: string;
  description?: string;
  templateHtml?: string;
  templateCss?: string;
  scope?: "GLOBAL" | "USER" | "ENTITY"; // Added to match test expectations
  scopeId?: string | null; // Added to match test expectations
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CertificateTemplateResponse {
  success: boolean;
  data?: CertificateTemplate | CertificateTemplate[];
  error?: string;
  errors?: string[]; // Added to match test expectations
  message?: string;
}

export interface CertificateTemplateListResponse {
  success: boolean;
  data?: CertificateTemplate[]; // Changed to direct array to match test expectations
  error?: string;
  message?: string; // Added to match test expectations
  pagination?: {
    // Added as direct property to match test expectations
    page: number;
    limit: number;
    total: number;
    totalPages: number; // Changed from 'pages' to 'totalPages' to match test
  };
}
