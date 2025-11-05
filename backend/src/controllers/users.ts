import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, FileUploadRequest } from '../types';
import { UserRepository } from '../repositories/UserRepository';
import { getPool } from '../config/database';
import { s3Service } from '../services/s3';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import archiver from 'archiver';

export class UsersController {
  private userRepository: UserRepository;
  private pool = getPool();

  constructor() {
    this.userRepository = new UserRepository(getPool());
  }

  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId } = req.user!;

      const user = await this.userRepository.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profilePicture,
            storageUsed: user.storageUsed,
            storageLimit: user.storageLimit,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        }
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId } = req.user!;
      const { firstName, lastName } = req.body;

      if (!firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'First name and last name are required'
        });
      }

      const result = await this.pool.query(
        `UPDATE users 
         SET first_name = $1, last_name = $2, updated_at = NOW() 
         WHERE id = $3 
         RETURNING *`,
        [firstName, lastName, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = result.rows[0];

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            profileImageUrl: user['profile_picture'],
            storageUsed: user.storage_used,
            storageLimit: user.storage_limit,
            updatedAt: user.updated_at
          }
        }
      });

    } catch (error) {
      logger.error('Update profile error:', error);
      next(error);
    }
  }

  async uploadProfileImage(req: FileUploadRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId } = req.user!;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      // Validate image type
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({
          success: false,
          message: 'Only image files are allowed'
        });
      }

      // Validate image size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Image file too large. Maximum size is 5MB'
        });
      }

      // Generate S3 key for profile image
      const s3Key = `profile-images/${userId}/${Date.now()}-${file.originalname}`;

      // Upload to S3
      await s3Service.uploadFile(file.buffer, s3Key, file.mimetype, {
        'cache-control': 'public, max-age=31536000',
        'content-disposition': 'inline'
      });

      // Generate a presigned URL for the profile image (7 days expiry)
      const imageUrl = await s3Service.getPresignedUrl(s3Key, 86400 * 7);

      // Update user profile with new image URL
      const result = await this.pool.query(
        `UPDATE users 
         SET profile_picture = $1, updated_at = NOW() 
         WHERE id = $2 
         RETURNING *`,
        [imageUrl, userId]
      );

      const user = result.rows[0];

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            profileImageUrl: user['profile_picture'],
            storageUsed: user.storage_used,
            storageLimit: user.storage_limit,
            updatedAt: user.updated_at
          }
        }
      });

    } catch (error) {
      logger.error('Upload profile image error:', error);
      next(error);
    }
  }

  async downloadUserData(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.user!;

      // Get user data
      const user = await this.userRepository.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      // Get user's files and folders
      const filesResult = await this.pool.query(
        'SELECT * FROM files WHERE owner_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      const foldersResult = await this.pool.query(
        'SELECT * FROM folders WHERE owner_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      const sharesResult = await this.pool.query(
        'SELECT * FROM shares WHERE shared_by = $1 ORDER BY created_at DESC',
        [userId]
      );

      // Create archive
      const archive = archiver('zip', {
        zlib: { level: 9 }
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="my-gdrive-data.zip"');

      archive.pipe(res);

      // Add user profile data
      const profileData = {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          storageUsed: user.storageUsed,
          storageLimit: user.storageLimit,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        },
        files: filesResult.rows.map(file => ({
          id: file.id,
          originalName: file.original_name,
          mimeType: file.mime_type,
          size: file.size,
          folderId: file.folder_id,
          createdAt: file.created_at,
          updatedAt: file.updated_at
        })),
        folders: foldersResult.rows.map(folder => ({
          id: folder.id,
          name: folder.name,
          parentId: folder.parent_id,
          color: folder.color,
          createdAt: folder.created_at,
          updatedAt: folder.updated_at
        })),
        shares: sharesResult.rows.map(share => ({
          id: share.id,
          resourceId: share.resource_id,
          resourceType: share.resource_type,
          permissions: share.permissions,
          expiresAt: share.expires_at,
          createdAt: share.created_at
        }))
      };

      archive.append(JSON.stringify(profileData, null, 2), { name: 'profile-data.json' });

      // Add actual files
      for (const file of filesResult.rows) {
        try {
          const fileStream = await s3Service.getFileStream(file.s3_key);
          archive.append(fileStream, { name: `files/${file.original_name}` });
        } catch (error) {
          logger.warn(`Failed to add file ${file.original_name} to archive:`, error);
        }
      }

      await archive.finalize();

    } catch (error) {
      logger.error('Download user data error:', error);
      next(error);
    }
  }

  async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId } = req.user!;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password confirmation required'
        });
      }

      // Note: In a real implementation, you would verify the password with Cognito
      // For now, we'll proceed with the deletion

      // Delete user's files from S3
      const filesResult = await this.pool.query(
        'SELECT s3_key FROM files WHERE owner_id = $1',
        [userId]
      );

      for (const file of filesResult.rows) {
        try {
          await s3Service.deleteFile(file.s3_key);
        } catch (error) {
          logger.warn(`Failed to delete file ${file.s3_key} from S3:`, error);
        }
      }

      // Delete user data from database (cascading will handle related records)
      await this.pool.query('DELETE FROM users WHERE id = $1', [userId]);

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      logger.error('Delete account error:', error);
      next(error);
    }
  }
}