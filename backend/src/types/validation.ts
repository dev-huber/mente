// Validation types for consistency across services

export interface ValidationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface UploadValidationResult extends ValidationResult {
  data?: {
    buffer: Buffer;
    mimetype: string;
    size: number;
    filename?: string;
  };
}
