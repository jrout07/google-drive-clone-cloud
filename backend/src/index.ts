import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error';
import { connectDatabase } from './config/database';

// Initialize database connection first
async function startServer() {
  try {
    // Connect to database first
    await connectDatabase();
    logger.info('✅ Database connection established');

    // Now import routes after database is connected
    const { default: authRoutes } = await import('./routes/auth');
    const { default: fileRoutes } = await import('./routes/files');
    const { default: userRoutes } = await import('./routes/users');
    const { default: folderRoutes } = await import('./routes/folders');
    const { default: shareRoutes } = await import('./routes/shares');
    const { default: healthRoutes } = await import('./routes/health');

    const app = express();

    // Trust proxy for load balancer
    app.set('trust proxy', 1);

    // Security middleware
    app.use(helmet({
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

    // CORS configuration
    app.use(cors({
      origin: config.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use(limiter);

    // Body parsing middleware - skip for file upload routes
    app.use((req, res, next) => {
      // Skip JSON parsing for file upload endpoints
      if (req.path.includes('/profile/image') || req.path.includes('/upload')) {
        return next();
      }
      express.json({ limit: '10mb' })(req, res, next);
    });
    
    app.use((req, res, next) => {
      // Skip URL encoding for file upload endpoints
      if (req.path.includes('/profile/image') || req.path.includes('/upload')) {
        return next();
      }
      express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
    });

    // Compression middleware
    app.use(compression());

    // Logging middleware
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim())
      }
    }));

    // Health check endpoint (before auth)
    app.use('/health', healthRoutes);

    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/files', fileRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/folders', folderRoutes);
    app.use('/api/shares', shareRoutes);

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    });

    // Error handling middleware
    app.use(errorHandler);

    // Start server
    const PORT = config.port || 3000;
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${config.nodeEnv} mode`);
      logger.info(`📋 Environment: ${config.nodeEnv}`);
      logger.info(`🗄️  Database: ${config.database.host}:${config.database.port}/${config.database.database}`);
      logger.info(`☁️  AWS Region: ${config.aws.region}`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return app;

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
