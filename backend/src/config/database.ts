import { Pool, PoolConfig } from 'pg';
import { config, initializeSecrets } from './config';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Database connection pool
let pool: Pool;

// Directly use system CA certs by their symlinked filenames
const RDS_CA_CERT_PATHS = [
  '/etc/ssl/certs/ce5e74ef.0', // Amazon_Root_CA_1.pem
  '/etc/ssl/certs/fd08c599.0', // Amazon_Root_CA_1.pem (alt)
  '/etc/ssl/certs/fb5fa911.0', // Amazon_Root_CA_2.pem
  '/etc/ssl/certs/d41b5e2a.0', // Amazon_Root_CA_4.pem
  '/opt/aws/amazon-root-ca-1.pem', // AWS CLI location
  path.join(__dirname, '..', '..', 'certs', 'amazon-root-ca-1.pem'), // Local project certs
  path.join(__dirname, '..', '..', 'certs', 'rds-ca-2019-root.pem'), // Alternative local
];

// Embedded AWS RDS CA Certificate (fallback)
const EMBEDDED_RDS_CA_CERT = `-----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIuJruydjsw2hUwsKLXpURJmzqP7hLSZWlKMgqlWKYl1
e8Qr9M2kVwmdlfPeG98VzRPAQI4MIjHuzcp8sAYrlNtfD4L5PZRJ5PkFWO4xCx2v
X4oMJo5HvBLpPb1BzCvs4j/n5wZjL+Tj0L4DQ4o8aQj5kEtg8j7kKKcVYFrykpvI
0lrNUk4fTClk5/0VEYGlKmgbV8YL9X5rCYx04b8oNj7TlLlwPMrVfEHnuPbnl9k8
aXnKPzOjbUgVHtCgHAOAY8bZNbpZ
-----END CERTIFICATE-----`;

// Function to load RDS CA certificate
const loadRDSCertificate = (): string => {
  // Try to load certificate from various paths
  for (const certPath of RDS_CA_CERT_PATHS) {
    try {
      if (fs.existsSync(certPath)) {
        const cert = fs.readFileSync(certPath, 'utf8');
        logger.debug(`🔒 Using RDS certificate from: ${certPath}`);
        return cert;
      }
    } catch (error) {
      logger.debug(`Failed to load certificate from ${certPath}:`, error);
    }
  }
  
  // Fallback to embedded certificate
  logger.debug('🔒 Using embedded RDS certificate (fallback)');
  return EMBEDDED_RDS_CA_CERT;
};

// SSL Configuration function
const getSSLConfig = () => {
  if (!config.database.ssl) {
    return false;
  }

  const rdsCert = loadRDSCertificate();
  
  if (config.nodeEnv === 'production') {
    // Production: Use strict SSL verification with AWS RDS CA
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
    // Development: Encrypted connection with permissive validation
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

    // Create connection pool
    pool = new Pool(dbConfig);

    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('✅ Database connected successfully');
    logger.info(`📊 Database: ${config.database.host}:${config.database.port}/${config.database.database}`);
    logger.info(`🔒 SSL: ${config.database.ssl ? (config.nodeEnv === 'production' ? 'Enabled (Verified)' : 'Enabled (Development)') : 'Disabled'}`);
  } catch (error) {
    if (config.nodeEnv === 'development') {
      logger.warn('⚠️ Database connection failed in development mode - continuing without database');
      logger.warn('💡 To connect to database, start PostgreSQL or update .env file');
    } else {
      logger.error('❌ Database connection failed:', error);
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
