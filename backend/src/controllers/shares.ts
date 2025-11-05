import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { getPool } from '../config/database';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export class SharesController {
  private pool = getPool();

  async createShare(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId } = req.user!;
      const { resourceId, resourceType, permissions, expiresAt, password } = req.body;

      if (!resourceId || !resourceType) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID and type are required'
        });
      }

      // Check if user owns the resource
      const resourceTable = resourceType === 'file' ? 'files' : 'folders';
      const resourceResult = await this.pool.query(
        `SELECT id, owner_id FROM ${resourceTable} WHERE id = $1`,
        [resourceId]
      );

      if (resourceResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      if (resourceResult.rows[0].owner_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only share your own resources'
        });
      }

      // Generate share token
      const shareToken = crypto.randomBytes(32).toString('hex');
      const hashedPassword = password ? crypto.createHash('sha256').update(password).digest('hex') : null;

      const shareResult = await this.pool.query(
        `INSERT INTO shares 
         (resource_id, resource_type, shared_by, share_token, permissions, expires_at, password_hash, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) 
         RETURNING *`,
        [resourceId, resourceType, userId, shareToken, permissions || 'read', expiresAt, hashedPassword]
      );

      const share = shareResult.rows[0];

      res.status(201).json({
        success: true,
        data: {
          share: {
            id: share.id,
            shareToken: share.share_token,
            resourceType: share.resource_type,
            permissions: share.permissions,
            expiresAt: share.expires_at,
            isPasswordProtected: !!hashedPassword,
            shareUrl: `${req.protocol}://${req.get('host')}/shared/${shareToken}`
          }
        }
      });

    } catch (error) {
      logger.error('Create share error:', error);
      next(error);
    }
  }

  async getShares(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId } = req.user!;
      const { type } = req.query;

      let query = `
        SELECT s.*, 
               CASE 
                 WHEN s.resource_type = 'file' THEN f.original_name
                 WHEN s.resource_type = 'folder' THEN fo.name
               END as resource_name
        FROM shares s
        LEFT JOIN files f ON s.resource_type = 'file' AND s.resource_id = f.id
        LEFT JOIN folders fo ON s.resource_type = 'folder' AND s.resource_id = fo.id
        WHERE s.shared_by = $1
      `;
      
      const params = [userId];

      if (type) {
        query += ' AND s.resource_type = $2';
        params.push(type as string);
      }

      query += ' ORDER BY s.created_at DESC';

      const result = await this.pool.query(query, params);

      const shares = result.rows.map(row => ({
        id: row.id,
        resourceId: row.resource_id,
        resourceType: row.resource_type,
        resourceName: row.resource_name,
        shareToken: row.share_token,
        permissions: row.permissions,
        expiresAt: row.expires_at,
        isPasswordProtected: !!row.password_hash,
        createdAt: row.created_at,
        shareUrl: `${req.protocol}://${req.get('host')}/shared/${row.share_token}`
      }));

      res.json({
        success: true,
        data: {
          shares
        }
      });

    } catch (error) {
      logger.error('Get shares error:', error);
      next(error);
    }
  }

  async getSharedResource(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { token } = req.params;
      const { password } = req.body;

      // Get share details
      const shareResult = await this.pool.query(
        'SELECT * FROM shares WHERE share_token = $1',
        [token]
      );

      if (shareResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Share not found'
        });
      }

      const share = shareResult.rows[0];

      // Check if share has expired
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return res.status(410).json({
          success: false,
          message: 'Share has expired'
        });
      }

      // Check password if required
      if (share.password_hash) {
        if (!password) {
          return res.status(401).json({
            success: false,
            message: 'Password required',
            requiresPassword: true
          });
        }

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
        if (hashedPassword !== share.password_hash) {
          return res.status(401).json({
            success: false,
            message: 'Invalid password'
          });
        }
      }

      // Get resource details
      const resourceTable = share.resource_type === 'file' ? 'files' : 'folders';
      const resourceResult = await this.pool.query(
        `SELECT * FROM ${resourceTable} WHERE id = $1`,
        [share.resource_id]
      );

      if (resourceResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Shared resource no longer exists'
        });
      }

      const resource = resourceResult.rows[0];

      res.json({
        success: true,
        data: {
          share: {
            id: share.id,
            resourceType: share.resource_type,
            permissions: share.permissions,
            expiresAt: share.expires_at
          },
          resource: share.resource_type === 'file' ? {
            id: resource.id,
            originalName: resource.original_name,
            mimeType: resource.mime_type,
            size: resource.size,
            createdAt: resource.created_at
          } : {
            id: resource.id,
            name: resource.name,
            createdAt: resource.created_at
          }
        }
      });

    } catch (error) {
      logger.error('Get shared resource error:', error);
      next(error);
    }
  }

  async deleteShare(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { userId } = req.user!;
      const { id } = req.params;

      const result = await this.pool.query(
        'DELETE FROM shares WHERE id = $1 AND shared_by = $2 RETURNING *',
        [id, userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Share not found or not authorized'
        });
      }

      res.json({
        success: true,
        message: 'Share deleted successfully'
      });

    } catch (error) {
      logger.error('Delete share error:', error);
      next(error);
    }
  }
}