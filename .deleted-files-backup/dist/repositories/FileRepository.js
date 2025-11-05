"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileRepository = void 0;
const logger_1 = require("../utils/logger");
class FileRepository {
    constructor(pool) {
        this.pool = pool;
    }
    async create(fileData) {
        const query = `
      INSERT INTO files (name, original_name, mime_type, size, s3_key, s3_bucket, folder_id, owner_id, checksum)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
        try {
            const result = await this.pool.query(query, [
                fileData.name,
                fileData.originalName,
                fileData.mimeType,
                fileData.size,
                fileData.s3Key,
                fileData.s3Bucket,
                fileData.folderId || null,
                fileData.ownerId,
                fileData.checksum
            ]);
            return this.mapDbRowToFile(result.rows[0]);
        }
        catch (error) {
            logger_1.logger.error('Error creating file:', error);
            throw new Error('Failed to create file');
        }
    }
    async findById(id) {
        const query = 'SELECT * FROM files WHERE id = $1';
        try {
            const result = await this.pool.query(query, [id]);
            return result.rows[0] ? this.mapDbRowToFile(result.rows[0]) : null;
        }
        catch (error) {
            logger_1.logger.error('Error finding file by id:', error);
            throw new Error('Failed to find file');
        }
    }
    async findByOwnerId(ownerId, folderId) {
        let query = 'SELECT * FROM files WHERE owner_id = $1';
        const params = [ownerId];
        if (folderId) {
            query += ' AND folder_id = $2';
            params.push(folderId);
        }
        else {
            query += ' AND folder_id IS NULL';
        }
        query += ' ORDER BY created_at DESC';
        try {
            const result = await this.pool.query(query, params);
            return result.rows.map(row => this.mapDbRowToFile(row));
        }
        catch (error) {
            logger_1.logger.error('Error finding files by owner:', error);
            throw new Error('Failed to find files');
        }
    }
    async findByFolderId(folderId) {
        const query = 'SELECT * FROM files WHERE folder_id = $1 ORDER BY created_at DESC';
        try {
            const result = await this.pool.query(query, [folderId]);
            return result.rows.map(row => this.mapDbRowToFile(row));
        }
        catch (error) {
            logger_1.logger.error('Error finding files by folder:', error);
            throw new Error('Failed to find files');
        }
    }
    async update(id, updateData) {
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (updateData.name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(updateData.name);
        }
        if (updateData.folderId !== undefined) {
            updates.push(`folder_id = $${paramCount++}`);
            values.push(updateData.folderId);
        }
        if (updateData.isPublic !== undefined) {
            updates.push(`is_public = $${paramCount++}`);
            values.push(updateData.isPublic);
        }
        if (updates.length === 0) {
            return this.findById(id);
        }
        values.push(id);
        const query = `
      UPDATE files 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;
        try {
            const result = await this.pool.query(query, values);
            return result.rows[0] ? this.mapDbRowToFile(result.rows[0]) : null;
        }
        catch (error) {
            logger_1.logger.error('Error updating file:', error);
            throw new Error('Failed to update file');
        }
    }
    async incrementDownloadCount(id) {
        const query = 'UPDATE files SET download_count = download_count + 1 WHERE id = $1';
        try {
            await this.pool.query(query, [id]);
        }
        catch (error) {
            logger_1.logger.error('Error incrementing download count:', error);
            throw new Error('Failed to increment download count');
        }
    }
    async delete(id) {
        const query = 'DELETE FROM files WHERE id = $1';
        try {
            const result = await this.pool.query(query, [id]);
            return (result.rowCount ?? 0) > 0;
        }
        catch (error) {
            logger_1.logger.error('Error deleting file:', error);
            throw new Error('Failed to delete file');
        }
    }
    async searchFiles(ownerId, searchTerm) {
        const query = `
      SELECT * FROM files 
      WHERE owner_id = $1 AND (
        name ILIKE $2 OR 
        original_name ILIKE $2 OR 
        mime_type ILIKE $2
      )
      ORDER BY created_at DESC
    `;
        try {
            const result = await this.pool.query(query, [ownerId, `%${searchTerm}%`]);
            return result.rows.map(row => this.mapDbRowToFile(row));
        }
        catch (error) {
            logger_1.logger.error('Error searching files:', error);
            throw new Error('Failed to search files');
        }
    }
    async getStorageUsedByOwner(ownerId) {
        const query = 'SELECT COALESCE(SUM(size), 0) as total_size FROM files WHERE owner_id = $1';
        try {
            const result = await this.pool.query(query, [ownerId]);
            return parseInt(result.rows[0].total_size);
        }
        catch (error) {
            logger_1.logger.error('Error calculating storage used:', error);
            throw new Error('Failed to calculate storage used');
        }
    }
    mapDbRowToFile(row) {
        return {
            id: row.id,
            name: row.name,
            originalName: row.original_name,
            mimeType: row.mime_type,
            size: parseInt(row.size),
            s3Key: row.s3_key,
            s3Bucket: row.s3_bucket,
            folderId: row.folder_id,
            ownerId: row.owner_id,
            isPublic: row.is_public,
            downloadCount: row.download_count,
            version: row.version,
            checksum: row.checksum,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
}
exports.FileRepository = FileRepository;
//# sourceMappingURL=FileRepository.js.map