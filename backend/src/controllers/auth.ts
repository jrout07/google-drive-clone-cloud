import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth';
import { cognitoService } from '../services/cognito';
import { UserRepository } from '../repositories/UserRepository';
import { getPool } from '../config/database';
import { logger } from '../utils/logger';

export class AuthController {
  private userRepository: UserRepository;

  constructor() {
    // Initialize repository lazily to handle cases where DB is not available
    this.userRepository = new UserRepository(getPool());
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { email, username, password, firstName, lastName } = req.body;

      // Basic validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters long'
        });
      }

      // Check if user already exists in our database
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create user in Cognito
      const cognitoResult = await cognitoService.signUp({
        email,
        username,
        password,
        firstName,
        lastName
      });

      // Get user data from Cognito
      const cognitoUserData = await cognitoService.getUserData(username || email);

      // Create user in our database
      const user = await this.userRepository.create({
        email: cognitoUserData.email,
        firstName: cognitoUserData.given_name || firstName,
        lastName: cognitoUserData.family_name || lastName,
        cognitoUserId: cognitoUserData.sub,
        profilePicture: undefined
      });

      logger.info(`New user registered: ${user.email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: cognitoUserData.username
          },
          needsConfirmation: cognitoResult.needsConfirmation
        }
      });
    } catch (error) {
      logger.error('Registration failed:', error);
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { usernameOrEmail, password, cognitoToken } = req.body;

      let cognitoUser;
      let authResult;

      if (cognitoToken) {
        // Legacy: Login with Cognito token (for external authentication)
        cognitoUser = await authService.verifyCognitoToken(cognitoToken);
      } else if (usernameOrEmail && password) {
        // New: Login with username/email and password
        if (!usernameOrEmail || !password) {
          return res.status(400).json({
            success: false,
            message: 'Username/email and password are required'
          });
        }

        authResult = await cognitoService.signIn({
          usernameOrEmail,
          password
        });

        cognitoUser = authResult.user;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Either cognitoToken or usernameOrEmail and password are required'
        });
      }

      // Find or create user in our database
      let user = await this.userRepository.findByCognitoId(cognitoUser.sub);
      
      if (!user) {
        // Create new user
        user = await this.userRepository.create({
          email: cognitoUser.email,
          firstName: cognitoUser.given_name || '',
          lastName: cognitoUser.family_name || '',
          cognitoUserId: cognitoUser.sub,
          profilePicture: undefined
        });
        logger.info(`New user created via login: ${user.email}`);
      } else {
        // Update user info if needed
        if (user.email !== cognitoUser.email || 
            user.firstName !== cognitoUser.given_name ||
            user.lastName !== cognitoUser.family_name) {
          await this.userRepository.update(user.id, {
            email: cognitoUser.email,
            firstName: cognitoUser.given_name || user.firstName,
            lastName: cognitoUser.family_name || user.lastName
          });
        }
      }

      // Generate our JWT token
      const jwtToken = authService.generateJWT({
        userId: user.id,
        email: user.email,
        cognitoUserId: user.cognitoUserId
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profilePicture: user.profilePicture,
            storageUsed: user.storageUsed,
            storageLimit: user.storageLimit
          },
          token: jwtToken
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  async verifyToken(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'Authorization header is required'
        });
      }

      const token = authService.extractTokenFromHeader(authHeader);
      const payload = authService.verifyJWT(token);

      // Get fresh user data
      const user = await this.userRepository.findById(payload.userId);
      
      if (!user) {
        return res.status(401).json({
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
            profilePicture: user.profilePicture,
            storageUsed: user.storageUsed,
            storageLimit: user.storageLimit
          }
        }
      });

    } catch (error) {
      logger.error('Token verification error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      // In a stateless JWT system, logout is handled client-side
      // Here we could blacklist the token if needed
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      next(error);
    }
  }
}