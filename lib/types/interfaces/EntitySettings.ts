export interface EntitySettings {
  id: string;
  entityId: string;
  certificatesEnabled: boolean;
  certificateSettings?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface EntitySettingsUpdateRequest {
  certificatesEnabled?: boolean;
  certificateSettings?: any;
}

export interface EntitySettingsResponse {
  success: boolean;
  data?: EntitySettings;
  error?: string;
}
