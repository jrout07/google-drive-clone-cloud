"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transaction = exports.query = exports.healthCheck = exports.closeDatabase = exports.getPool = exports.connectDatabase = void 0;
const pg_1 = require("pg");
const config_1 = require("./config");
const logger_1 = require("../utils/logger");
let pool;
const dbConfig = {
    host: config_1.config.database.host,
    port: config_1.config.database.port,
    database: config_1.config.database.database,
    user: config_1.config.database.username,
    password: config_1.config.database.password,
    ssl: config_1.config.database.ssl ? { rejectUnauthorized: false } : false,
    min: config_1.config.database.pool.min,
    max: config_1.config.database.pool.max,
    idleTimeoutMillis: config_1.config.database.pool.idleTimeoutMillis,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
    query_timeout: 30000,
};
const connectDatabase = async () => {
    try {
        await (0, config_1.initializeSecrets)();
        dbConfig.host = config_1.config.database.host;
        dbConfig.user = config_1.config.database.username;
        dbConfig.password = config_1.config.database.password;
        dbConfig.database = config_1.config.database.database;
        pool = new pg_1.Pool(dbConfig);
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        logger_1.logger.info('✅ Database connected successfully');
        logger_1.logger.info(`📊 Database: ${config_1.config.database.host}:${config_1.config.database.port}/${config_1.config.database.database}`);
    }
    catch (error) {
        if (config_1.config.nodeEnv === 'development') {
            logger_1.logger.warn('⚠️ Database connection failed in development mode - continuing without database');
            logger_1.logger.warn('💡 To connect to database, start PostgreSQL or update .env file');
        }
        else {
            logger_1.logger.error('❌ Database connection failed:', error);
            throw error;
        }
    }
};
exports.connectDatabase = connectDatabase;
const getPool = () => {
    if (!pool) {
        throw new Error('Database not initialized. Call connectDatabase() first.');
    }
    return pool;
};
exports.getPool = getPool;
const closeDatabase = async () => {
    if (pool) {
        await pool.end();
        logger_1.logger.info('🔒 Database connection closed');
    }
};
exports.closeDatabase = closeDatabase;
const healthCheck = async () => {
    try {
        if (!pool) {
            return false;
        }
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        return true;
    }
    catch (error) {
        logger_1.logger.debug('Database health check failed:', error);
        return false;
    }
};
exports.healthCheck = healthCheck;
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        logger_1.logger.debug('Executed query', { text, duration, rows: res.rowCount });
        return res;
    }
    catch (error) {
        logger_1.logger.error('Query execution failed:', { text, error });
        throw error;
    }
};
exports.query = query;
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.transaction = transaction;
exports.default = {
    connectDatabase: exports.connectDatabase,
    getPool: exports.getPool,
    closeDatabase: exports.closeDatabase,
    healthCheck: exports.healthCheck,
    query: exports.query,
    transaction: exports.transaction,
};
//# sourceMappingURL=database.js.map