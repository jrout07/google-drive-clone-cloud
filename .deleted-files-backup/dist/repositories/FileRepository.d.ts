import { Pool } from 'pg';
import { File, CreateFileInput, UpdateFileInput } from '../models/File';
export declare class FileRepository {
    private pool;
    constructor(pool: Pool);
    create(fileData: CreateFileInput): Promise<File>;
    findById(id: string): Promise<File | null>;
    findByOwnerId(ownerId: string, folderId?: string): Promise<File[]>;
    findByFolderId(folderId: string): Promise<File[]>;
    update(id: string, updateData: UpdateFileInput): Promise<File | null>;
    incrementDownloadCount(id: string): Promise<void>;
    delete(id: string): Promise<boolean>;
    searchFiles(ownerId: string, searchTerm: string): Promise<File[]>;
    getStorageUsedByOwner(ownerId: string): Promise<number>;
    private mapDbRowToFile;
}
//# sourceMappingURL=FileRepository.d.ts.map