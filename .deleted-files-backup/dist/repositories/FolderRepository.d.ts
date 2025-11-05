import { Pool } from 'pg';
import { Folder, CreateFolderInput, UpdateFolderInput, FolderWithChildren } from '../models/Folder';
export declare class FolderRepository {
    private pool;
    constructor(pool: Pool);
    create(folderData: CreateFolderInput): Promise<Folder>;
    findById(id: string): Promise<Folder | null>;
    findByOwnerId(ownerId: string, parentId?: string): Promise<Folder[]>;
    findWithContents(id: string): Promise<FolderWithChildren | null>;
    update(id: string, updateData: UpdateFolderInput): Promise<Folder | null>;
    delete(id: string): Promise<boolean>;
    getFolderTree(ownerId: string, rootId?: string): Promise<FolderWithChildren[]>;
    private mapDbRowToFolder;
}
//# sourceMappingURL=FolderRepository.d.ts.map