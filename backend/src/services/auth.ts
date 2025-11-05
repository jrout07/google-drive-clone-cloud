import { CognitoJwtVerifier } from 'aws-jwt-verify';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export interface CognitoUser {
  sub: string;
  email: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  cognitoUserId: string;
}

export class AuthService {
  private cognitoVerifier: any;

  constructor() {
    // Initialize with basic configuration for now
    if (config.aws.cognito.userPoolId && config.aws.cognito.clientId && config.nodeEnv === 'production') {
      this.cognitoVerifier = CognitoJwtVerifier.create({
        userPoolId: config.aws.cognito.userPoolId,
        tokenUse: 'access',
        clientId: config.aws.cognito.clientId,
      });
    } else {
      // Development mode - Cognito verifier is optional
      this.cognitoVerifier = null;
    }
  }

  async verifyCognitoToken(token: string): Promise<CognitoUser> {
    try {
      // Always use real Cognito token verification
      if (!this.cognitoVerifier) {
        throw new Error('Cognito verifier not initialized');
      }

      const payload = await this.cognitoVerifier.verify(token);
      return {
        sub: payload.sub,
        email: payload.email || '',
        given_name: payload.given_name || '',
        family_name: payload.family_name || '',
        picture: payload.picture,
      };
    } catch (error) {
      logger.error('Cognito token verification failed:', error);
      throw new Error('Invalid or expired token');
    }
  }

  generateJWT(payload: JWTPayload): string {
    const options: SignOptions = {
      expiresIn: config.jwt.expiresIn as any,
      issuer: 'gdrive-clone',
    };
    return jwt.sign(payload, config.jwt.secret, options);
  }

  verifyJWT(token: string): JWTPayload {
    try {
      const payload = jwt.verify(token, config.jwt.secret) as JWTPayload;
      return payload;
    } catch (error) {
      logger.error('JWT verification failed:', error);
      throw new Error('Invalid or expired token');
    }
  }

  extractTokenFromHeader(authHeader: string): string {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }
    return authHeader.substring(7);
  }
}

export const authService = new AuthService();