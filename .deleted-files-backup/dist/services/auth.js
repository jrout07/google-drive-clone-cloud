"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const aws_jwt_verify_1 = require("aws-jwt-verify");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
class AuthService {
    constructor() {
        if (config_1.config.aws.cognito.userPoolId && config_1.config.aws.cognito.clientId && config_1.config.nodeEnv === 'production') {
            this.cognitoVerifier = aws_jwt_verify_1.CognitoJwtVerifier.create({
                userPoolId: config_1.config.aws.cognito.userPoolId,
                tokenUse: 'access',
                clientId: config_1.config.aws.cognito.clientId,
            });
        }
        else {
            this.cognitoVerifier = null;
        }
    }
    async verifyCognitoToken(token) {
        try {
            if (!this.cognitoVerifier) {
                throw new Error('Cognito verifier not initialized');
            }
            const payload = await this.cognitoVerifier.verify(token);
            return {
                sub: payload.sub,
                email: payload.email || '',
                given_name: payload.given_name || '',
                family_name: payload.family_name || '',
                picture: payload.picture,
            };
        }
        catch (error) {
            logger_1.logger.error('Cognito token verification failed:', error);
            throw new Error('Invalid or expired token');
        }
    }
    generateJWT(payload) {
        const options = {
            expiresIn: config_1.config.jwt.expiresIn,
            issuer: 'gdrive-clone',
        };
        return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, options);
    }
    verifyJWT(token) {
        try {
            const payload = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            return payload;
        }
        catch (error) {
            logger_1.logger.error('JWT verification failed:', error);
            throw new Error('Invalid or expired token');
        }
    }
    extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new Error('Invalid authorization header');
        }
        return authHeader.substring(7);
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.js.map