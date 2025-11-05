import { Pool, PoolConfig } from 'pg';
import { config, initializeSecrets } from './config';
import { logger } from '../utils/logger';

// Database connection pool
let pool: Pool;

// SSL Configuration function
const getSSLConfig = () => {
  // Use process.env.DB_SSL for SSL configuration
  return process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false;
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
    pool = new Pool({
      host: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.username,
      password: config.database.password,
      ssl: getSSLConfig(),
    });

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
