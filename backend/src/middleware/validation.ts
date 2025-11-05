import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      logger.warn('Validation error:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      });
    }
    
    next();
  };
};

// Common validation schemas
export const schemas = {
  login: Joi.object({
    cognitoToken: Joi.string().required(),
  }),

  createFolder: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    parentId: Joi.string().uuid().optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  }),

  updateFolder: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    parentId: Joi.string().uuid().allow(null).optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).allow(null).optional(),
    isPublic: Joi.boolean().optional(),
  }),

  updateFile: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    folderId: Joi.string().uuid().allow(null).optional(),
    isPublic: Joi.boolean().optional(),
  }),

  createShare: Joi.object({
    fileId: Joi.string().uuid().optional(),
    folderId: Joi.string().uuid().optional(),
    sharedWithEmail: Joi.string().email().optional(),
    permission: Joi.string().valid('read', 'write', 'admin').required(),
    expiresAt: Joi.date().greater('now').optional(),
    isPublic: Joi.boolean().optional(),
  }).xor('fileId', 'folderId'),

  updateUser: Joi.object({
    firstName: Joi.string().min(1).max(100).optional(),
    lastName: Joi.string().min(1).max(100).optional(),
    profilePicture: Joi.string().uri().optional(),
  }),
};

// Validate UUID parameter
export const validateUUIDParam = (paramName: string) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const value = req.params[paramName];
    const uuidSchema = Joi.string().uuid().required();
    
    const { error } = uuidSchema.validate(value);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }
    
    next();
  };
};