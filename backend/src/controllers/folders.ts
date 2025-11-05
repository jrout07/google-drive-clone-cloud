import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { FolderRepository } from '../repositories/FolderRepository';
import { getPool } from '../config/database';
import { logger } from '../utils/logger';
import { s3Service } from '../services/s3';
import archiver from 'archiver';

export class FoldersController {
  private folderRepository: FolderRepository;
  private pool = getPool();

  constructor() {
    this.folderRepository = new FolderRepository(getPool());
  }

  async createFolder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId } = req.user!;
      const { name, parentId, color } = req.body as any;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Folder name is required'
        });
      }

      const folder = await this.folderRepository.create({
        name,
        parentId: parentId || null,
        ownerId: userId,
        color
      });

      res.status(201).json({
        success: true,
        data: {
          folder
        }
      });

    } catch (error) {
      logger.error('Create folder error:', error);
      next(error);
    }
  }

  async getFolders(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId } = req.user!;
      const { parentId, tree } = req.query;

      let folders;
      if (tree === 'true') {
        folders = await this.folderRepository.getFolderTree(userId, parentId as string);
      } else {
        folders = await this.folderRepository.findByOwnerId(userId, parentId as string);
      }

      res.json({
        success: true,
        data: {
          folders
        }
      });

    } catch (error) {
      logger.error('Get folders error:', error);
      next(error);
    }
  }

  async getFolder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { userId } = req.user!;
      const { contents } = req.query;

      let folder;
      if (contents === 'true') {
        folder = await this.folderRepository.findWithContents(id);
      } else {
        folder = await this.folderRepository.findById(id);
      }

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }

      // Check permissions
      if (folder.ownerId !== userId && !folder.isPublic) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: {
          folder
        }
      });

    } catch (error) {
      logger.error('Get folder error:', error);
      next(error);
    }
  }

  async updateFolder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { userId } = req.user!;
      const { name, parentId, color, isPublic } = req.body as any;

      const folder = await this.folderRepository.findById(id);
      
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }

      // Check permissions
      if (folder.ownerId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const updatedFolder = await this.folderRepository.update(id, {
        name,
        parentId,
        color,
        isPublic
      });

      res.json({
        success: true,
        data: {
          folder: updatedFolder
        }
      });

    } catch (error) {
      logger.error('Update folder error:', error);
      next(error);
    }
  }

  async deleteFolder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { userId } = req.user!;

      const folder = await this.folderRepository.findById(id);
      
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
      }

      // Check permissions
      if (folder.ownerId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await this.folderRepository.delete(id);

      res.json({
        success: true,
        message: 'Folder deleted successfully'
      });

    } catch (error) {
      logger.error('Delete folder error:', error);
      next(error);
    }
  }

  async downloadFolder(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.user!;

      const folder = await this.folderRepository.findById(id);
      
      if (!folder) {
        res.status(404).json({
          success: false,
          message: 'Folder not found'
        });
        return;
      }

      // Check permissions
      if (folder.ownerId !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied'
        });
        return;
      }

      // Get all files and subfolders recursively
      const { files, folders } = await this.getFolderContentsRecursive(id, userId);

      if (files.length === 0 && folders.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Folder is empty'
        });
        return;
      }

      // Create archive
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${folder.name}.zip"`);

      archive.pipe(res);

      // Add files to archive
      for (const file of files) {
        try {
          const fileStream = await s3Service.getFileStream(file.s3_key);
          const relativePath = this.buildFilePath(file, folders);
          archive.append(fileStream, { name: relativePath });
        } catch (error) {
          logger.warn(`Failed to add file ${file.original_name} to archive:`, error);
        }
      }

      await archive.finalize();

    } catch (error) {
      logger.error('Download folder error:', error);
      next(error);
    }
  }

  private async getFolderContentsRecursive(folderId: string, userId: string): Promise<{ files: any[], folders: any[] }> {
    const allFiles: any[] = [];
    const allFolders: any[] = [];
    const processedFolders = new Set<string>();

    const processFolderRecursive = async (currentFolderId: string) => {
      if (processedFolders.has(currentFolderId)) {
        return; // Prevent infinite loops
      }
      processedFolders.add(currentFolderId);

      // Get files in current folder
      const filesResult = await this.pool.query(
        'SELECT * FROM files WHERE folder_id = $1 AND owner_id = $2',
        [currentFolderId, userId]
      );
      allFiles.push(...filesResult.rows);

      // Get subfolders
      const foldersResult = await this.pool.query(
        'SELECT * FROM folders WHERE parent_id = $1 AND owner_id = $2',
        [currentFolderId, userId]
      );
      
      for (const subfolder of foldersResult.rows) {
        allFolders.push(subfolder);
        await processFolderRecursive(subfolder.id);
      }
    };

    await processFolderRecursive(folderId);

    return { files: allFiles, folders: allFolders };
  }

  private buildFilePath(file: any, folders: any[]): string {
    const folderMap = new Map(folders.map(f => [f.id, f]));
    const pathParts: string[] = [];
    
    let currentFolderId = file.folder_id;
    while (currentFolderId) {
      const folder = folderMap.get(currentFolderId);
      if (!folder) break;
      pathParts.unshift(folder.name);
      currentFolderId = folder.parent_id;
    }
    
    pathParts.push(file.original_name);
    return pathParts.join('/');
  }
}