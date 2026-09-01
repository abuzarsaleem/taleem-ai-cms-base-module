export interface UploadFileInput {
  key: string;
  body: Buffer;
  contentType: string;
}

export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface IFileStorageService {
  upload(input: UploadFileInput): Promise<{ key: string }>;
  delete(key: string): Promise<void>;
  resolveUrl(storedValue: string): Promise<string>;
  isManagedKey(storedValue: string): boolean;
  extractKey(storedValue: string): string | null;
}
