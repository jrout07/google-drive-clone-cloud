"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
    });
    let error = { ...err };
    error.message = err.message;
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new Error(message);
        error.statusCode = 404;
    }
    if (err.code === '11000') {
        const message = 'Duplicate field value entered';
        error = new Error(message);
        error.statusCode = 400;
    }
    if (err.name === 'ValidationError') {
        const message = 'Validation Error';
        error = new Error(message);
        error.statusCode = 400;
    }
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = new Error(message);
        error.statusCode = 401;
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = new Error(message);
        error.statusCode = 401;
    }
    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.js.map