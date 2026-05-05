export type MediaErrorCode =
  | 'FILE_TOO_LARGE'
  | 'INVALID_MIME_TYPE'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'PROCESSING_FAILED';

export interface MediaDomainError {
  code: MediaErrorCode;
  message: string;
}
