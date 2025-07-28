export interface EntitySettings {
  certificatesEnabled: boolean;
  certificateSettings?: any;
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
