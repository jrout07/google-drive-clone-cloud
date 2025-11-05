"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUUIDParam = exports.schemas = exports.validateRequest = void 0;
const joi_1 = __importDefault(require("joi"));
const logger_1 = require("../utils/logger");
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            logger_1.logger.warn('Validation error:', error.details);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message,
                })),
            });
        }
        next();
    };
};
exports.validateRequest = validateRequest;
exports.schemas = {
    login: joi_1.default.object({
        cognitoToken: joi_1.default.string().required(),
    }),
    createFolder: joi_1.default.object({
        name: joi_1.default.string().min(1).max(255).required(),
        parentId: joi_1.default.string().uuid().optional(),
        color: joi_1.default.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
    }),
    updateFolder: joi_1.default.object({
        name: joi_1.default.string().min(1).max(255).optional(),
        parentId: joi_1.default.string().uuid().allow(null).optional(),
        color: joi_1.default.string().pattern(/^#[0-9A-F]{6}$/i).allow(null).optional(),
        isPublic: joi_1.default.boolean().optional(),
    }),
    updateFile: joi_1.default.object({
        name: joi_1.default.string().min(1).max(255).optional(),
        folderId: joi_1.default.string().uuid().allow(null).optional(),
        isPublic: joi_1.default.boolean().optional(),
    }),
    createShare: joi_1.default.object({
        fileId: joi_1.default.string().uuid().optional(),
        folderId: joi_1.default.string().uuid().optional(),
        sharedWithEmail: joi_1.default.string().email().optional(),
        permission: joi_1.default.string().valid('read', 'write', 'admin').required(),
        expiresAt: joi_1.default.date().greater('now').optional(),
        isPublic: joi_1.default.boolean().optional(),
    }).xor('fileId', 'folderId'),
    updateUser: joi_1.default.object({
        firstName: joi_1.default.string().min(1).max(100).optional(),
        lastName: joi_1.default.string().min(1).max(100).optional(),
        profilePicture: joi_1.default.string().uri().optional(),
    }),
};
const validateUUIDParam = (paramName) => {
    return (req, res, next) => {
        const value = req.params[paramName];
        const uuidSchema = joi_1.default.string().uuid().required();
        const { error } = uuidSchema.validate(value);
        if (error) {
            return res.status(400).json({
                success: false,
                message: `Invalid ${paramName} format`,
            });
        }
        next();
    };
};
exports.validateUUIDParam = validateUUIDParam;
//# sourceMappingURL=validation.js.map