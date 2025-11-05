"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUploadError = exports.uploadMultiple = exports.uploadSingle = void 0;
const multer_1 = __importDefault(require("multer"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    if (config_1.config.upload.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: config_1.config.upload.maxFileSize,
    },
});
exports.uploadSingle = upload.single('file');
exports.uploadMultiple = upload.array('files', 10);
const handleUploadError = (error, req, res, next) => {
    if (error instanceof multer_1.default.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: `File too large. Maximum size is ${config_1.config.upload.maxFileSize / 1024 / 1024}MB`,
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
        logger_1.logger.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message: 'Upload failed',
        });
    }
    next();
};
exports.handleUploadError = handleUploadError;
//# sourceMappingURL=upload.js.map