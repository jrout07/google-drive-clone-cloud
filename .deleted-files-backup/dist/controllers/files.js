"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const FileRepository_1 = require("../repositories/FileRepository");
const UserRepository_1 = require("../repositories/UserRepository");
const database_1 = require("../config/database");
const s3_1 = require("../services/s3");
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
class FilesController {
    constructor() {
        this.fileRepository = new FileRepository_1.FileRepository((0, database_1.getPool)());
        this.userRepository = new UserRepository_1.UserRepository((0, database_1.getPool)());
    }
    async uploadFile(req, res, next) {
        try {
            const { userId } = req.user;
            const file = req.file;
            if (!file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file provided'
                });
            }
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            if (user.storageUsed + file.size > user.storageLimit) {
                return res.status(400).json({
                    success: false,
                    message: 'Storage limit exceeded'
                });
            }
            const s3Key = s3_1.s3Service.generateFileKey(userId, file.originalname);
            const checksum = crypto_1.default.createHash('sha256').update(file.buffer).digest('hex');
            await s3_1.s3Service.uploadFile(file.buffer, s3Key, file.mimetype, {
                userId,
                originalName: file.originalname,
                checksum
            });
            const savedFile = await this.fileRepository.create({
                name: file.originalname,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                s3Key,
                s3Bucket: process.env.S3_BUCKET_NAME || 'gdrive-clone-files',
                folderId: req.body?.folderId || null,
                ownerId: userId,
                checksum
            });
            await this.userRepository.updateStorageUsed(userId, user.storageUsed + file.size);
            res.status(201).json({
                success: true,
                data: {
                    file: savedFile
                }
            });
        }
        catch (error) {
            logger_1.logger.error('File upload error:', error);
            next(error);
        }
    }
    async getFiles(req, res, next) {
        try {
            const { userId } = req.user;
            const { folderId, search } = req.query;
            let files;
            if (search) {
                files = await this.fileRepository.searchFiles(userId, search);
            }
            else {
                files = await this.fileRepository.findByOwnerId(userId, folderId);
            }
            res.json({
                success: true,
                data: {
                    files
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get files error:', error);
            next(error);
        }
    }
    async getFile(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.user;
            const file = await this.fileRepository.findById(id);
            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
            }
            if (file.ownerId !== userId && !file.isPublic) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            res.json({
                success: true,
                data: {
                    file
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get file error:', error);
            next(error);
        }
    }
    async downloadFile(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.user;
            const file = await this.fileRepository.findById(id);
            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
            }
            if (file.ownerId !== userId && !file.isPublic) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            const presignedUrl = await s3_1.s3Service.getPresignedUrl(file.s3Key, 3600);
            await this.fileRepository.incrementDownloadCount(id);
            res.json({
                success: true,
                data: {
                    downloadUrl: presignedUrl,
                    fileName: file.originalName,
                    mimeType: file.mimeType
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Download file error:', error);
            next(error);
        }
    }
    async updateFile(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.user;
            const { name, folderId, isPublic } = req.body;
            const file = await this.fileRepository.findById(id);
            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
            }
            if (file.ownerId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            const updatedFile = await this.fileRepository.update(id, {
                name,
                folderId,
                isPublic
            });
            res.json({
                success: true,
                data: {
                    file: updatedFile
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Update file error:', error);
            next(error);
        }
    }
    async deleteFile(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.user;
            const file = await this.fileRepository.findById(id);
            if (!file) {
                return res.status(404).json({
                    success: false,
                    message: 'File not found'
                });
            }
            if (file.ownerId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            await s3_1.s3Service.deleteFile(file.s3Key);
            await this.fileRepository.delete(id);
            const user = await this.userRepository.findById(userId);
            if (user) {
                await this.userRepository.updateStorageUsed(userId, user.storageUsed - file.size);
            }
            res.json({
                success: true,
                message: 'File deleted successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Delete file error:', error);
            next(error);
        }
    }
}
exports.FilesController = FilesController;
//# sourceMappingURL=files.js.map