"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = require("./config/config");
const logger_1 = require("./utils/logger");
const error_1 = require("./middleware/error");
const database_1 = require("./config/database");
async function startServer() {
    try {
        await (0, database_1.connectDatabase)();
        logger_1.logger.info('✅ Database connection established');
        const { default: authRoutes } = await Promise.resolve().then(() => __importStar(require('./routes/auth')));
        const { default: fileRoutes } = await Promise.resolve().then(() => __importStar(require('./routes/files')));
        const { default: userRoutes } = await Promise.resolve().then(() => __importStar(require('./routes/users')));
        const { default: folderRoutes } = await Promise.resolve().then(() => __importStar(require('./routes/folders')));
        const { default: shareRoutes } = await Promise.resolve().then(() => __importStar(require('./routes/shares')));
        const { default: healthRoutes } = await Promise.resolve().then(() => __importStar(require('./routes/health')));
        const app = (0, express_1.default)();
        app.set('trust proxy', 1);
        app.use((0, helmet_1.default)({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));
        app.use((0, cors_1.default)({
            origin: config_1.config.cors.origins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        }));
        const limiter = (0, express_rate_limit_1.default)({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: 'Too many requests from this IP, please try again later.',
            standardHeaders: true,
            legacyHeaders: false,
        });
        app.use(limiter);
        app.use(express_1.default.json({ limit: '10mb' }));
        app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        app.use((0, compression_1.default)());
        app.use((0, morgan_1.default)('combined', {
            stream: {
                write: (message) => logger_1.logger.info(message.trim())
            }
        }));
        app.use('/health', healthRoutes);
        app.use('/api/auth', authRoutes);
        app.use('/api/files', fileRoutes);
        app.use('/api/users', userRoutes);
        app.use('/api/folders', folderRoutes);
        app.use('/api/shares', shareRoutes);
        app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Route not found'
            });
        });
        app.use(error_1.errorHandler);
        const PORT = config_1.config.port || 3000;
        const server = app.listen(PORT, () => {
            logger_1.logger.info(`🚀 Server running on port ${PORT} in ${config_1.config.nodeEnv} mode`);
            logger_1.logger.info(`📋 Environment: ${config_1.config.nodeEnv}`);
            logger_1.logger.info(`🗄️  Database: ${config_1.config.database.host}:${config_1.config.database.port}/${config_1.config.database.database}`);
            logger_1.logger.info(`☁️  AWS Region: ${config_1.config.aws.region}`);
        });
        const gracefulShutdown = (signal) => {
            logger_1.logger.info(`${signal} received. Starting graceful shutdown...`);
            server.close(() => {
                logger_1.logger.info('HTTP server closed.');
                process.exit(0);
            });
            setTimeout(() => {
                logger_1.logger.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        return app;
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=index.js.map