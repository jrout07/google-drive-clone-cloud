import { 
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
  AdminGetUserCommand,
  AdminDeleteUserCommand,
  MessageActionType,
  DeliveryMediumType,
  AuthFlowType,
  ChallengeNameType
} from '@aws-sdk/client-cognito-identity-provider';
import { createHmac } from 'crypto';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export interface CognitoUserData {
  sub: string;
  email: string;
  username: string;
  given_name?: string;
  family_name?: string;
  email_verified?: boolean;
  phone_number?: string;
  phone_number_verified?: boolean;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  user: CognitoUserData;
}

export interface SignUpRequest {
  email: string;
  username?: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignInRequest {
  usernameOrEmail: string; // Can be username or email
  password: string;
}

export class CognitoService {
  private client: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.userPoolId = config.aws.cognito.userPoolId || '';
    this.clientId = config.aws.cognito.clientId || '';
    this.clientSecret = config.aws.cognito.clientSecret || '';

    // Always use real AWS Cognito (no mock auth)
    this.client = new CognitoIdentityProviderClient({
      region: config.aws.cognito.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId || '',
        secretAccessKey: config.aws.secretAccessKey || '',
      },
    });
  }

  // Calculate SECRET_HASH required for authentication
  private calculateSecretHash(username: string): string {
    return createHmac('SHA256', this.clientSecret)
      .update(username + this.clientId)
      .digest('base64');
  }

  async signUp(request: SignUpRequest): Promise<{ userId: string; needsConfirmation: boolean }> {
    try {
      // Generate a unique username since user pool is configured for email alias
      // Username cannot be in email format when email alias is enabled
      const uniqueUsername = request.username || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const command = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: uniqueUsername,
        UserAttributes: [
          { Name: 'email', Value: request.email },
          { Name: 'email_verified', Value: 'true' },
          ...(request.firstName ? [{ Name: 'given_name', Value: request.firstName }] : []),
          ...(request.lastName ? [{ Name: 'family_name', Value: request.lastName }] : []),
        ],
        TemporaryPassword: request.password,
        MessageAction: MessageActionType.SUPPRESS, // Don't send welcome email for now
      });

      const result = await this.client.send(command);

      // Set permanent password
      await this.setUserPassword(uniqueUsername, request.password);

      return {
        userId: uniqueUsername,
        needsConfirmation: false,
      };
    } catch (error: any) {
      logger.error('Cognito sign up failed:', error);
      
      // Handle specific Cognito errors
      if (error.name === 'InvalidPasswordException') {
        const message = error.message || '';
        if (message.includes('symbol characters')) {
          throw new Error('Password must contain special characters (!@#$%^&*)');
        } else if (message.includes('uppercase')) {
          throw new Error('Password must contain uppercase letters');
        } else if (message.includes('lowercase')) {
          throw new Error('Password must contain lowercase letters');
        } else if (message.includes('numeric')) {
          throw new Error('Password must contain numbers');
        } else if (message.includes('minimum')) {
          throw new Error('Password must be at least 8 characters long');
        } else {
          throw new Error('Password does not meet security requirements');
        }
      }
      
      if (error.name === 'UsernameExistsException') {
        throw new Error('An account with this email already exists');
      }
      
      if (error.name === 'InvalidParameterException') {
        const message = error.message || '';
        if (message.includes('email format')) {
          throw new Error('Invalid email format');
        }
        throw new Error('Invalid registration data provided');
      }
      
      // Generic fallback error
      throw new Error('Registration failed. Please try again.');
    }
  }

  async signIn(request: SignInRequest): Promise<AuthResult> {
    try {
      const command = new AdminInitiateAuthCommand({
        UserPoolId: this.userPoolId,
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.ADMIN_NO_SRP_AUTH,
        AuthParameters: {
          USERNAME: request.usernameOrEmail,
          PASSWORD: request.password,
          SECRET_HASH: this.calculateSecretHash(request.usernameOrEmail),
        },
      });

      const result = await this.client.send(command);

      if (result.ChallengeName) {
        throw new Error('Additional authentication challenges not supported yet');
      }

      if (!result.AuthenticationResult) {
        throw new Error('Authentication failed');
      }

      // Get user details
      const userData = await this.getUserData(request.usernameOrEmail);

      return {
        accessToken: result.AuthenticationResult.AccessToken!,
        refreshToken: result.AuthenticationResult.RefreshToken!,
        idToken: result.AuthenticationResult.IdToken!,
        user: userData,
      };
    } catch (error) {
      logger.error('Cognito sign in failed:', error);
      throw new Error('Invalid credentials');
    }
  }

  async getUserData(username: string): Promise<CognitoUserData> {
    try {
      const command = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      const result = await this.client.send(command);

      const attributes = result.UserAttributes || [];
      const getAttribute = (name: string) => attributes.find((attr: any) => attr.Name === name)?.Value;

      return {
        sub: result.Username || '',
        email: getAttribute('email') || '',
        username: result.Username || '',
        given_name: getAttribute('given_name'),
        family_name: getAttribute('family_name'),
        email_verified: getAttribute('email_verified') === 'true',
        phone_number: getAttribute('phone_number'),
        phone_number_verified: getAttribute('phone_number_verified') === 'true',
      };
    } catch (error) {
      logger.error('Failed to get user data:', error);
      throw new Error('User not found');
    }
  }

  private async setUserPassword(username: string, password: string): Promise<void> {
    const command = new AdminSetUserPasswordCommand({
      UserPoolId: this.userPoolId,
      Username: username,
      Password: password,
      Permanent: true,
    });

    await this.client.send(command);
  }

  async deleteUser(username: string): Promise<void> {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: this.userPoolId,
        Username: username,
      });

      await this.client.send(command);
    } catch (error) {
      logger.error('Failed to delete user:', error);
      throw new Error('Failed to delete user');
    }
  }
}

export const cognitoService = new CognitoService();