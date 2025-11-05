export interface Share {
  id: string;
  fileId?: string;
  folderId?: string;
  ownerId: string;
  sharedWithId?: string;
  sharedWithEmail?: string;
  permission: SharePermission;
  isPublic: boolean;
  publicToken?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum SharePermission {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin'
}

export interface CreateShareInput {
  fileId?: string;
  folderId?: string;
  ownerId: string;
  sharedWithEmail?: string;
  permission: SharePermission;
  isPublic?: boolean;
  expiresAt?: Date;
}

export interface UpdateShareInput {
  permission?: SharePermission;
  expiresAt?: Date;
}

export interface ShareWithDetails extends Share {
  fileName?: string;
  folderName?: string;
  ownerName?: string;
  sharedWithName?: string;
}