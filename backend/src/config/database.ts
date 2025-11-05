import { Pool } from 'pg';
import { logger } from '../utils/logger';

// Database connection pool
export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// Initialize database connection
export const connectDatabase = async (): Promise<void> => {
  try {
    // Test connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    logger.info('✅ Database connected successfully');
    logger.info(`📊 Database: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    logger.info(`🔒 SSL: ${process.env.DB_SSL === 'true' ? 'Enabled' : 'Disabled'}`);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('⚠️ Database connection failed in development mode - continuing without database');
      logger.warn('💡 To connect to database, start PostgreSQL or update .env file');
    } else {
      logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }
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
  closeDatabase,
  healthCheck,
  query,
  transaction,
};
