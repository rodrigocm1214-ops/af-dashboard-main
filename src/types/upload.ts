export interface UploadRecord {
  id: string;
  filename: string;
  type: 'meta' | 'hotmart' | 'kiwify';
  uploadDate: string;
  fileSize: number;
  recordsProcessed: number;
  status: 'success' | 'error';
  errorMessage?: string;
}