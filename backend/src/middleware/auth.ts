import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authService } from '../services/auth';
import { logger } from '../utils/logger';

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: 'Authorization header is required'
      });
      return;
    }

    const token = authService.extractTokenFromHeader(authHeader);
    const payload = authService.verifyJWT(token);

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      cognitoUserId: payload.cognitoUserId
    };

    next();
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authService.extractTokenFromHeader(authHeader);
      const payload = authService.verifyJWT(token);

      req.user = {
        userId: payload.userId,
        email: payload.email,
        cognitoUserId: payload.cognitoUserId
      };
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    logger.debug('Optional auth failed:', error);
    next();
  }
};