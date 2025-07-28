export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  templateHtml: string;
  templateCss?: string;
  scope: 'GLOBAL' | 'USER' | 'ENTITY';
  scopeId?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateTemplateInput {
  name: string;
  description?: string;
  templateHtml: string;
  templateCss?: string;
  scope: 'GLOBAL' | 'USER' | 'ENTITY';
  scopeId?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CertificateTemplateUpdateInput {
  name?: string;
  description?: string;
  templateHtml?: string;
  templateCss?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface CertificateTemplateResponse {
  success: boolean;
  data?: CertificateTemplate | CertificateTemplate[];
  error?: string;
  message?: string;
}

export interface CertificateTemplateListResponse {
  success: boolean;
  data?: {
    templates: CertificateTemplate[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  error?: string;
}
