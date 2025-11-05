import dotenv from 'dotenv';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Load environment variables
dotenv.config();

// AWS Secrets Manager client
const secretsManager = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-west-2'
});

interface DatabaseCredentials {
  username: string;
  password: string;
  endpoint: string;
  database: string;
}

let cachedSecrets: { [key: string]: any } = {};

const getSecret = async (secretName: string): Promise<any> => {
  if (cachedSecrets[secretName]) {
    return cachedSecrets[secretName];
  }

  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await secretsManager.send(command);
    
    if (response.SecretString) {
      cachedSecrets[secretName] = JSON.parse(response.SecretString);
      return cachedSecrets[secretName];
    }
  } catch (error) {
    console.warn(`Failed to retrieve secret ${secretName}:`, error);
    return null;
  }
};

// Configuration object
export const config = {
  // Server configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'gdrive',
    username: process.env.DB_USERNAME || 'gdrive_user',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production',
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
    }
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'gdrive-clone',
  },

  // AWS configuration
  aws: {
    region: process.env.AWS_REGION || 'us-west-2',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3: {
      bucket: process.env.S3_BUCKET_NAME || 'gdrive-clone-files',
      region: process.env.S3_REGION || 'us-west-2',
      presignedUrlExpiry: parseInt(process.env.S3_PRESIGNED_URL_EXPIRY || '3600', 10),
    },
    cognito: {
      userPoolId: process.env.COGNITO_USER_POOL_ID,
      clientId: process.env.COGNITO_CLIENT_ID,
      clientSecret: process.env.COGNITO_CLIENT_SECRET,
      region: process.env.COGNITO_REGION || 'us-west-2',
      issuerUrl: process.env.COGNITO_ISSUER_URL,
    },
    secrets: {
      databaseSecret: process.env.DATABASE_SECRET_NAME || 'gdrive/database',
      jwtSecret: process.env.JWT_SECRET_NAME || 'gdrive/jwt',
    }
  },

  // CORS configuration
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://your-domain.com'
    ],
  },

  // File upload configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10), // 100MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed',
    ],
    tempDir: process.env.UPLOAD_TEMP_DIR || '/tmp/uploads',
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
    logDir: process.env.LOG_DIR || './logs',
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  // Cache configuration
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10), // 1 hour
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
  }
};

// Initialize secrets from AWS Secrets Manager in production
export const initializeSecrets = async (): Promise<void> => {
  if (config.nodeEnv === 'production') {
    try {
      // Get database credentials
      const dbCredentials = await getSecret(config.aws.secrets.databaseSecret) as DatabaseCredentials;
      if (dbCredentials) {
        config.database.host = dbCredentials.endpoint;
        config.database.username = dbCredentials.username;
        config.database.password = dbCredentials.password;
        config.database.database = dbCredentials.database;
      }

      // Get JWT secret
      const jwtSecret = await getSecret(config.aws.secrets.jwtSecret);
      if (jwtSecret && jwtSecret.secret) {
        config.jwt.secret = jwtSecret.secret;
      }

      console.log('✅ Secrets initialized from AWS Secrets Manager');
    } catch (error) {
      console.error('❌ Failed to initialize secrets from AWS Secrets Manager:', error);
      throw error;
    }
  }
};

export default config;