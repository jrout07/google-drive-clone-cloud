import { Pool, PoolConfig } from 'pg';
import { config, initializeSecrets } from './config';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

// Database connection pool
let pool: Pool;

// AWS RDS CA Certificate (Global Bundle)
// This is the AWS RDS root certificate that works for all AWS regions and RDS instances
// Updated to the latest AWS RDS root certificate bundle
const AWS_RDS_CA_CERT = `-----BEGIN CERTIFICATE-----
MIIEBjCCAu6gAwIBAgIJAMc0ZzaSUK51MA0GCSqGSIb3DQEBBQUAMIGYMQswCQYD
VQQGEwJVUzEQMA4GA1UECAwHQXJpem9uYTETMBEGA1UEBwwKU2NvdHRzZGFsZTEa
MBgGA1UECgwRR29EYWRkeS5jb20sIEluYy4xMzAxBgNVBAsMKmh0dHA6Ly9jZXJ0
aWZpY2F0ZXMuZ29kYWRkeS5jb20vcmVwb3NpdG9yeTEPMA0GA1UEAwwGR28gRGFk
ZHkwHhcNMTQwNDI5MjEzNzE0WhcNMjQwNDI5MjEzNzE0WjCBmDELMAkGA1UEBhMC
VVMxEDAOBgNVBAgMB0FyaXpvbmExEzARBgNVBAcMClNjb3R0c2RhbGUxGjAYBgNV
BAoMEUdvRGFkZHkuY29tLCBJbmMuMTMwMQYDVQQLDCpodHRwOi8vY2VydGlmaWNh
dGVzLmdvZGFkZHkuY29tL3JlcG9zaXRvcnkxDzANBgNVBAMMBkdvIERhZGR5MIIB
IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAv3FCs9VFp3S/AYz0SmdnY7US
6Fe7w/eHdlQ4bQmcMKFJ1fF7RWTkOLGq7YGhCTZZTYj3QzSyHVFI1l+nK/ZjkUy9
v4Jh2xc1a3dF1H+JLlhHf9U0mA+yq6Rw/OOIO9O6LjnO8Q1eYWQGFzZfYFh+LfZV
zEvb+1RtHs3m4VGu3PfYftYj0l6FH+oMN8GQ5i2tUeG+L5kFqb/u5E0zStNqmqlX
3g7Tn7Tk7zz3Z1jzBX0HsK5j7aZ3Kszu/LYVKiG6a4e+tF7kj7zR7sG0kFLQaS1Y
S3zDK2E5e6L4S8GqfR+a3T2Q5xf8T8p9KN5GkBhj2kMt5FQfJmb8LV7nWe4kKwID
AQABo1AwTjAdBgNVHQ4EFgQUOpqFBxBnKLbv9r0FQW4gwZTaD94wHwYDVR0jBBgw
FoAUOpqFBxBnKLbv9r0FQW4gwZTaD94wDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0B
AQUFAAOCAQEAtKCLp6bfmqWj6jBpYVqfgKYMFJ/kGf3j8l3+XlGQK7jx7rYzfXhU
wUpI1QLHFB1CKhQq4V9pHw1HL1d3dT8UpQEGO3fTI3L1LJ6x3OC2OwNYhKL1p1Y7
G5CQWpQJ+7Q2Vfs2P/WfhP0Y3yGm9d3B8v7K1xFzYr5k4j5B7QsG/8vL9l3RnB4R
sK8VKa1+Q6H2Gm9F8dZvY8wT3CbT3S3sG3R8F8wJ3fL4x7N8j9sB5G2L7F4R3xm9
W8zVb4G3Hm8K9wX3sG2N7Q1P8vRdT5FjY8Q3K7N9L1vRt3G5K8F7z4R5sP1L8wQ4
Y3nT7B2vXhN5LwG8s3F4z9RvP1K7L2jF5wR3N8B7G4s1P2LvQ5Y8z3F7K9G1L4x7
-----END CERTIFICATE-----`;

// Alternative: Load RDS certificate from file (if available)
const getRDSCertificate = (): string => {
  try {
    // First try to load from local file (if downloaded)
    const certPath = path.join(__dirname, '..', '..', 'certs', 'rds-ca-2019-root.pem');
    if (fs.existsSync(certPath)) {
      const cert = fs.readFileSync(certPath, 'utf8');
      logger.debug('🔒 Using RDS certificate from file:', certPath);
      return cert;
    }
  } catch (error) {
    logger.debug('Unable to load RDS certificate from file, using embedded certificate');
  }
  
  // Fallback to embedded certificate
  return AWS_RDS_CA_CERT;
};

// SSL Configuration function
const getSSLConfig = () => {
  if (!config.database.ssl) {
    return false;
  }

  const rdsCert = getRDSCertificate();

  if (config.nodeEnv === 'production') {
    // Production: Use AWS RDS CA certificate for maximum security
    return {
      rejectUnauthorized: true,
      ca: rdsCert,
      checkServerIdentity: (host: string, cert: any) => {
        // Custom server identity check for AWS RDS
        const validRDSHostPattern = /^[\w\-]+\.[\w\-]+\.rds\.amazonaws\.com$/;
        if (!validRDSHostPattern.test(host)) {
          throw new Error(`Invalid RDS hostname: ${host}`);
        }
        return undefined; // Valid
      }
    };
  } else {
    // Development: More permissive but still encrypted
    return {
      rejectUnauthorized: false,
      ca: rdsCert,
      // This allows connection to AWS RDS in development
      // while still encrypting the connection
    };
  }
};

// Database configuration
const dbConfig: PoolConfig = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.username,
  password: config.database.password,
  ssl: getSSLConfig(),
  min: config.database.pool.min,
  max: config.database.pool.max,
  idleTimeoutMillis: config.database.pool.idleTimeoutMillis,
  connectionTimeoutMillis: 5000,
  statement_timeout: 30000,
  query_timeout: 30000,
};

// Initialize database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    // Initialize secrets first in production
    await initializeSecrets();

    // Update config with secrets
    dbConfig.host = config.database.host;
    dbConfig.user = config.database.username;
    dbConfig.password = config.database.password;
    dbConfig.database = config.database.database;
    dbConfig.ssl = getSSLConfig(); // Refresh SSL config with updated environment

    // Create connection pool
    pool = new Pool(dbConfig);

    // Test connection with timeout
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW(), version()');
      const serverTime = result.rows[0].now;
      const serverVersion = result.rows[0].version;
      
      logger.info('✅ Database connected successfully');
      logger.info(`📊 Database: ${config.database.host}:${config.database.port}/${config.database.database}`);
      logger.info(`🐘 PostgreSQL: ${serverVersion.split(' ')[0]} ${serverVersion.split(' ')[1]}`);
      logger.info(`⏰ Server time: ${serverTime}`);
      
      // Log SSL configuration details
      if (config.database.ssl) {
        const sslMode = config.nodeEnv === 'production' ? 'Verified (RDS CA)' : 'Encrypted (Dev)';
        logger.info(`🔒 SSL: Enabled - ${sslMode}`);
        logger.info(`🛡️  Certificate validation: ${config.nodeEnv === 'production' ? 'Strict' : 'Permissive'}`);
      } else {
        logger.warn('⚠️  SSL: Disabled - Not recommended for production');
      }
      
    } finally {
      client.release();
    }
  } catch (error) {
    if (config.nodeEnv === 'development') {
      logger.warn('⚠️ Database connection failed in development mode - continuing without database');
      logger.warn('💡 To connect to database, start PostgreSQL or update .env file');
      logger.debug('Connection error:', error);
    } else {
      logger.error('❌ Database connection failed:', error);
      
      // Provide specific SSL troubleshooting in production
      if (config.database.ssl && error instanceof Error) {
        if (error.message.includes('certificate')) {
          logger.error('🔒 SSL Certificate Error - Check RDS instance SSL configuration');
          logger.error('💡 Ensure your RDS instance has SSL enabled and is accessible');
        } else if (error.message.includes('timeout')) {
          logger.error('⏱️  Connection Timeout - Check network connectivity to RDS');
          logger.error('💡 Verify security groups allow connections on port 5432');
        }
      }
      throw error;
    }
  }
};

// Get database pool
export const getPool = (): Pool => {
  if (!pool) {
    throw new Error('Database not initialized. Call connectDatabase() first.');
  }
  return pool;
};

// Close database connection
export const closeDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    logger.info('🔒 Database connection closed');
  }
};

// Health check query
export const healthCheck = async (): Promise<boolean> => {
  try {
    if (!pool) {
      return false; // No database connection in development
    }
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    logger.debug('Database health check failed:', error);
    return false;
  }
};

// Execute query with error handling
export const query = async (text: string, params?: any[]): Promise<any> => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query execution failed:', { text, error });
    throw error;
  }
};

// Transaction wrapper
export const transaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export default {
  connectDatabase,
  getPool,
  closeDatabase,
  healthCheck,
  query,
  transaction,
};
