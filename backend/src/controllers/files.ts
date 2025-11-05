import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, FileUploadRequest } from '../types';
import { FileRepository } from '../repositories/FileRepository';
import { UserRepository } from '../repositories/UserRepository';
import { getPool } from '../config/database';
import { s3Service } from '../services/s3';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export class FilesController {
  private fileRepository: FileRepository;
  private userRepository: UserRepository;

  constructor() {
    this.fileRepository = new FileRepository(getPool());
    this.userRepository = new UserRepository(getPool());
  }

  async uploadFile(req: FileUploadRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId } = req.user!;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No file provided'
        });
      }

      // Check file size and user storage limits
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (user.storageUsed + file.size > user.storageLimit) {
        return res.status(400).json({
          success: false,
          message: 'Storage limit exceeded'
        });
      }

      // Generate S3 key and upload file
      const s3Key = s3Service.generateFileKey(userId, file.originalname);
      const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

      await s3Service.uploadFile(file.buffer, s3Key, file.mimetype, {
        userId,
        originalName: file.originalname,
        checksum
      });

      // Save file metadata to database
      const savedFile = await this.fileRepository.create({
        name: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        s3Key,
        s3Bucket: process.env.S3_BUCKET_NAME || 'gdrive-clone-files',
        folderId: (req.body as any)?.folderId || null,
        ownerId: userId,
        checksum
      });

      // Update user storage
      await this.userRepository.updateStorageUsed(userId, user.storageUsed + file.size);

      res.status(201).json({
        success: true,
        data: {
          file: savedFile
        }
      });

    } catch (error) {
      logger.error('File upload error:', error);
      next(error);
    }
  }

  async getFiles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId } = req.user!;
      const { folderId, search } = req.query;

      let files;
      if (search) {
        files = await this.fileRepository.searchFiles(userId, search as string);
      } else {
        files = await this.fileRepository.findByOwnerId(userId, folderId as string);
      }

      res.json({
        success: true,
        data: {
          files
        }
      });

    } catch (error) {
      logger.error('Get files error:', error);
      next(error);
    }
  }

  async getFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { userId } = req.user!;

      const file = await this.fileRepository.findById(id);
      
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Check permissions
      if (file.ownerId !== userId && !file.isPublic) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: {
          file
        }
      });

    } catch (error) {
      logger.error('Get file error:', error);
      next(error);
    }
  }

  async downloadFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { userId } = req.user!;

      const file = await this.fileRepository.findById(id);
      
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Check permissions
      if (file.ownerId !== userId && !file.isPublic) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Generate presigned URL
      const presignedUrl = await s3Service.getPresignedUrl(file.s3Key, 3600);

      // Increment download count
      await this.fileRepository.incrementDownloadCount(id);

      res.json({
        success: true,
        data: {
          downloadUrl: presignedUrl,
          fileName: file.originalName,
          mimeType: file.mimeType
        }
      });

    } catch (error) {
      logger.error('Download file error:', error);
      next(error);
    }
  }

  async updateFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { userId } = req.user!;
      const { name, folderId, isPublic } = req.body as any;

      const file = await this.fileRepository.findById(id);
      
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Check permissions
      if (file.ownerId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const updatedFile = await this.fileRepository.update(id, {
        name,
        folderId,
        isPublic
      });

      res.json({
        success: true,
        data: {
          file: updatedFile
        }
      });

    } catch (error) {
      logger.error('Update file error:', error);
      next(error);
    }
  }

  async deleteFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      const { userId } = req.user!;

      const file = await this.fileRepository.findById(id);
      
      if (!file) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      // Check permissions
      if (file.ownerId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Delete from S3
      await s3Service.deleteFile(file.s3Key);

      // Delete from database
      await this.fileRepository.delete(id);

      // Update user storage
      const user = await this.userRepository.findById(userId);
      if (user) {
        await this.userRepository.updateStorageUsed(userId, user.storageUsed - file.size);
      }

      res.json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error) {
      logger.error('Delete file error:', error);
      next(error);
    }
  }
}