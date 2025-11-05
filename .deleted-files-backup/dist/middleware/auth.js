"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticate = void 0;
const auth_1 = require("../services/auth");
const logger_1 = require("../utils/logger");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({
                success: false,
                message: 'Authorization header is required'
            });
            return;
        }
        const token = auth_1.authService.extractTokenFromHeader(authHeader);
        const payload = auth_1.authService.verifyJWT(token);
        req.user = {
            userId: payload.userId,
            email: payload.email,
            cognitoUserId: payload.cognitoUserId
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Authentication middleware error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};
exports.authenticate = authenticate;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = auth_1.authService.extractTokenFromHeader(authHeader);
            const payload = auth_1.authService.verifyJWT(token);
            req.user = {
                userId: payload.userId,
                email: payload.email,
                cognitoUserId: payload.cognitoUserId
            };
        }
        next();
    }
    catch (error) {
        logger_1.logger.debug('Optional auth failed:', error);
        next();
    }
};
exports.optionalAuth = optionalAuth;
//# sourceMappingURL=auth.js.map