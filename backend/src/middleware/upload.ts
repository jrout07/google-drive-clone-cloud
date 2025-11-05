import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { config } from '../config/config';
import { logger } from '../utils/logger';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Check file type
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

// Create multer upload middleware
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

// Single file upload middleware
export const uploadSingle = upload.single('file');

// Multiple files upload middleware (max 10 files)
export const uploadMultiple = upload.array('files', 10);

// Error handling middleware for multer
export const handleUploadError = (error: any, req: Request, res: Response, next: NextFunction): Response | void => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${config.upload.maxFileSize / 1024 / 1024}MB`,
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files at once',
      });
    }
  }

  if (error && error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error) {
    logger.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Upload failed',
    });
  }

  next();
};