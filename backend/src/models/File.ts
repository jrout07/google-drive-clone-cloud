export interface File {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  s3Bucket: string;
  folderId?: string;
  ownerId: string;
  isPublic: boolean;
  downloadCount: number;
  version: number;
  checksum: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFileInput {
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  s3Bucket: string;
  folderId?: string;
  ownerId: string;
  checksum: string;
}

export interface UpdateFileInput {
  name?: string;
  folderId?: string;
  isPublic?: boolean;
}

export interface FileWithPresignedUrl extends File {
  presignedUrl?: string;
}