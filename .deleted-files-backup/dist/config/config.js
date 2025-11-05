"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSecrets = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
dotenv_1.default.config();
const secretsManager = new client_secrets_manager_1.SecretsManagerClient({
    region: process.env.AWS_REGION || 'us-west-2'
});
let cachedSecrets = {};
const getSecret = async (secretName) => {
    if (cachedSecrets[secretName]) {
        return cachedSecrets[secretName];
    }
    try {
        const command = new client_secrets_manager_1.GetSecretValueCommand({ SecretId: secretName });
        const response = await secretsManager.send(command);
        if (response.SecretString) {
            cachedSecrets[secretName] = JSON.parse(response.SecretString);
            return cachedSecrets[secretName];
        }
    }
    catch (error) {
        console.warn(`Failed to retrieve secret ${secretName}:`, error);
        return null;
    }
};
exports.config = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
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
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: process.env.JWT_ISSUER || 'gdrive-clone',
    },
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
            region: process.env.COGNITO_REGION || 'us-west-2',
            issuerUrl: process.env.COGNITO_ISSUER_URL,
        },
        secrets: {
            databaseSecret: process.env.DATABASE_SECRET_NAME || 'gdrive/database',
            jwtSecret: process.env.JWT_SECRET_NAME || 'gdrive/jwt',
        }
    },
    cors: {
        origins: process.env.CORS_ORIGINS?.split(',') || [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://your-domain.com'
        ],
    },
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10),
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
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined',
        enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
        logDir: process.env.LOG_DIR || './logs',
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
        max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    },
    cache: {
        ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
        maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000', 10),
    },
    security: {
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
        sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
    }
};
const initializeSecrets = async () => {
    if (exports.config.nodeEnv === 'production') {
        try {
            const dbCredentials = await getSecret(exports.config.aws.secrets.databaseSecret);
            if (dbCredentials) {
                exports.config.database.host = dbCredentials.endpoint;
                exports.config.database.username = dbCredentials.username;
                exports.config.database.password = dbCredentials.password;
                exports.config.database.database = dbCredentials.database;
            }
            const jwtSecret = await getSecret(exports.config.aws.secrets.jwtSecret);
            if (jwtSecret && jwtSecret.secret) {
                exports.config.jwt.secret = jwtSecret.secret;
            }
            console.log('✅ Secrets initialized from AWS Secrets Manager');
        }
        catch (error) {
            console.error('❌ Failed to initialize secrets from AWS Secrets Manager:', error);
            throw error;
        }
    }
};
exports.initializeSecrets = initializeSecrets;
exports.default = exports.config;
//# sourceMappingURL=config.js.map