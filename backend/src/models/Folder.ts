export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  ownerId: string;
  isPublic: boolean;
  color?: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFolderInput {
  name: string;
  parentId?: string;
  ownerId: string;
  color?: string;
}

export interface UpdateFolderInput {
  name?: string;
  parentId?: string;
  color?: string;
  isPublic?: boolean;
}

export interface FolderWithChildren extends Folder {
  children?: Folder[];
  files?: File[];
}

import { File } from './File';