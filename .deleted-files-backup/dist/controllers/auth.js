"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_1 = require("../services/auth");
const cognito_1 = require("../services/cognito");
const UserRepository_1 = require("../repositories/UserRepository");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
class AuthController {
    constructor() {
        this.userRepository = new UserRepository_1.UserRepository((0, database_1.getPool)());
    }
    async register(req, res, next) {
        try {
            const { email, username, password, firstName, lastName } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }
            if (password.length < 8) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 8 characters long'
                });
            }
            const existingUser = await this.userRepository.findByEmail(email);
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }
            const cognitoResult = await cognito_1.cognitoService.signUp({
                email,
                username,
                password,
                firstName,
                lastName
            });
            const cognitoUserData = await cognito_1.cognitoService.getUserData(username || email);
            const user = await this.userRepository.create({
                email: cognitoUserData.email,
                firstName: cognitoUserData.given_name || firstName,
                lastName: cognitoUserData.family_name || lastName,
                cognitoUserId: cognitoUserData.sub,
                profilePicture: undefined
            });
            logger_1.logger.info(`New user registered: ${user.email}`);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        username: cognitoUserData.username
                    },
                    needsConfirmation: cognitoResult.needsConfirmation
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Registration failed:', error);
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const { usernameOrEmail, password, cognitoToken } = req.body;
            let cognitoUser;
            let authResult;
            if (cognitoToken) {
                cognitoUser = await auth_1.authService.verifyCognitoToken(cognitoToken);
            }
            else if (usernameOrEmail && password) {
                if (!usernameOrEmail || !password) {
                    return res.status(400).json({
                        success: false,
                        message: 'Username/email and password are required'
                    });
                }
                authResult = await cognito_1.cognitoService.signIn({
                    usernameOrEmail,
                    password
                });
                cognitoUser = authResult.user;
            }
            else {
                return res.status(400).json({
                    success: false,
                    message: 'Either cognitoToken or usernameOrEmail and password are required'
                });
            }
            let user = await this.userRepository.findByCognitoId(cognitoUser.sub);
            if (!user) {
                user = await this.userRepository.create({
                    email: cognitoUser.email,
                    firstName: cognitoUser.given_name || '',
                    lastName: cognitoUser.family_name || '',
                    cognitoUserId: cognitoUser.sub,
                    profilePicture: undefined
                });
                logger_1.logger.info(`New user created via login: ${user.email}`);
            }
            else {
                if (user.email !== cognitoUser.email ||
                    user.firstName !== cognitoUser.given_name ||
                    user.lastName !== cognitoUser.family_name) {
                    await this.userRepository.update(user.id, {
                        email: cognitoUser.email,
                        firstName: cognitoUser.given_name || user.firstName,
                        lastName: cognitoUser.family_name || user.lastName
                    });
                }
            }
            const jwtToken = auth_1.authService.generateJWT({
                userId: user.id,
                email: user.email,
                cognitoUserId: user.cognitoUserId
            });
            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        profilePicture: user.profilePicture,
                        storageUsed: user.storageUsed,
                        storageLimit: user.storageLimit
                    },
                    token: jwtToken
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            next(error);
        }
    }
    async verifyToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({
                    success: false,
                    message: 'Authorization header is required'
                });
            }
            const token = auth_1.authService.extractTokenFromHeader(authHeader);
            const payload = auth_1.authService.verifyJWT(token);
            const user = await this.userRepository.findById(payload.userId);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }
            res.json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        profilePicture: user.profilePicture,
                        storageUsed: user.storageUsed,
                        storageLimit: user.storageLimit
                    }
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Token verification error:', error);
            res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
    }
    async logout(req, res, next) {
        try {
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Logout error:', error);
            next(error);
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.js.map