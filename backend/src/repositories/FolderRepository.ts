import { Pool } from 'pg';
import { Folder, CreateFolderInput, UpdateFolderInput, FolderWithChildren } from '../models/Folder';
import { logger } from '../utils/logger';

export class FolderRepository {
  constructor(private pool: Pool) {}

  async create(folderData: CreateFolderInput): Promise<Folder> {
    const query = `
      INSERT INTO folders (name, parent_id, owner_id, color, path)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    // Generate path for materialized path queries
    let path = '/' + folderData.name;
    if (folderData.parentId) {
      const parent = await this.findById(folderData.parentId);
      if (parent) {
        path = parent.path + '/' + folderData.name;
      }
    }

    try {
      const result = await this.pool.query(query, [
        folderData.name,
        folderData.parentId || null,
        folderData.ownerId,
        folderData.color || null,
        path
      ]);
      
      return this.mapDbRowToFolder(result.rows[0]);
    } catch (error) {
      logger.error('Error creating folder:', error);
      throw new Error('Failed to create folder');
    }
  }

  async findById(id: string): Promise<Folder | null> {
    const query = 'SELECT * FROM folders WHERE id = $1';
    
    try {
      const result = await this.pool.query(query, [id]);
      return result.rows[0] ? this.mapDbRowToFolder(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error finding folder by id:', error);
      throw new Error('Failed to find folder');
    }
  }

  async findByOwnerId(ownerId: string, parentId?: string): Promise<Folder[]> {
    let query = 'SELECT * FROM folders WHERE owner_id = $1';
    const params = [ownerId];
    
    if (parentId) {
      query += ' AND parent_id = $2';
      params.push(parentId);
    } else {
      query += ' AND parent_id IS NULL';
    }
    
    query += ' ORDER BY name ASC';
    
    try {
      const result = await this.pool.query(query, params);
      return result.rows.map(row => this.mapDbRowToFolder(row));
    } catch (error) {
      logger.error('Error finding folders by owner:', error);
      throw new Error('Failed to find folders');
    }
  }

  async findWithContents(id: string): Promise<FolderWithChildren | null> {
    try {
      const folder = await this.findById(id);
      if (!folder) return null;

      // Get subfolders
      const subfoldersQuery = 'SELECT * FROM folders WHERE parent_id = $1 ORDER BY name ASC';
      const subfoldersResult = await this.pool.query(subfoldersQuery, [id]);
      const children = subfoldersResult.rows.map(row => this.mapDbRowToFolder(row));

      // Get files
      const filesQuery = 'SELECT * FROM files WHERE folder_id = $1 ORDER BY name ASC';
      const filesResult = await this.pool.query(filesQuery, [id]);
      const files = filesResult.rows.map(row => ({
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
      }));

      return {
        ...folder,
        children,
        files
      };
    } catch (error) {
      logger.error('Error finding folder with contents:', error);
      throw new Error('Failed to find folder with contents');
    }
  }

  async update(id: string, updateData: UpdateFolderInput): Promise<Folder | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updateData.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(updateData.name);
    }
    if (updateData.parentId !== undefined) {
      updates.push(`parent_id = $${paramCount++}`);
      values.push(updateData.parentId);
    }
    if (updateData.color !== undefined) {
      updates.push(`color = $${paramCount++}`);
      values.push(updateData.color);
    }
    if (updateData.isPublic !== undefined) {
      updates.push(`is_public = $${paramCount++}`);
      values.push(updateData.isPublic);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    // Update path if name or parent changed
    if (updateData.name !== undefined || updateData.parentId !== undefined) {
      const folder = await this.findById(id);
      if (folder) {
        let newPath = '/' + (updateData.name || folder.name);
        if (updateData.parentId || folder.parentId) {
          const parentId = updateData.parentId !== undefined ? updateData.parentId : folder.parentId;
          if (parentId) {
            const parent = await this.findById(parentId);
            if (parent) {
              newPath = parent.path + '/' + (updateData.name || folder.name);
            }
          }
        }
        updates.push(`path = $${paramCount++}`);
        values.push(newPath);
      }
    }

    values.push(id);
    const query = `
      UPDATE folders 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0] ? this.mapDbRowToFolder(result.rows[0]) : null;
    } catch (error) {
      logger.error('Error updating folder:', error);
      throw new Error('Failed to update folder');
    }
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM folders WHERE id = $1';
    
    try {
      const result = await this.pool.query(query, [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      logger.error('Error deleting folder:', error);
      throw new Error('Failed to delete folder');
    }
  }

  async getFolderTree(ownerId: string, rootId?: string): Promise<FolderWithChildren[]> {
    try {
      const rootFolders = await this.findByOwnerId(ownerId, rootId);
      
      const buildTree = async (folders: Folder[]): Promise<FolderWithChildren[]> => {
        const result: FolderWithChildren[] = [];
        
        for (const folder of folders) {
          const children = await this.findByOwnerId(ownerId, folder.id);
          const folderWithChildren: FolderWithChildren = {
            ...folder,
            children: await buildTree(children)
          };
          result.push(folderWithChildren);
        }
        
        return result;
      };

      return buildTree(rootFolders);
    } catch (error) {
      logger.error('Error getting folder tree:', error);
      throw new Error('Failed to get folder tree');
    }
  }

  private mapDbRowToFolder(row: any): Folder {
    return {
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      ownerId: row.owner_id,
      isPublic: row.is_public,
      color: row.color,
      path: row.path,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}