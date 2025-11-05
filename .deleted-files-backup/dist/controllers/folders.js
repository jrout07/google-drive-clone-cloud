"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FoldersController = void 0;
const FolderRepository_1 = require("../repositories/FolderRepository");
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
class FoldersController {
    constructor() {
        this.folderRepository = new FolderRepository_1.FolderRepository((0, database_1.getPool)());
    }
    async createFolder(req, res, next) {
        try {
            const { userId } = req.user;
            const { name, parentId, color } = req.body;
            if (!name) {
                return res.status(400).json({
                    success: false,
                    message: 'Folder name is required'
                });
            }
            const folder = await this.folderRepository.create({
                name,
                parentId: parentId || null,
                ownerId: userId,
                color
            });
            res.status(201).json({
                success: true,
                data: {
                    folder
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Create folder error:', error);
            next(error);
        }
    }
    async getFolders(req, res, next) {
        try {
            const { userId } = req.user;
            const { parentId, tree } = req.query;
            let folders;
            if (tree === 'true') {
                folders = await this.folderRepository.getFolderTree(userId, parentId);
            }
            else {
                folders = await this.folderRepository.findByOwnerId(userId, parentId);
            }
            res.json({
                success: true,
                data: {
                    folders
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get folders error:', error);
            next(error);
        }
    }
    async getFolder(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.user;
            const { contents } = req.query;
            let folder;
            if (contents === 'true') {
                folder = await this.folderRepository.findWithContents(id);
            }
            else {
                folder = await this.folderRepository.findById(id);
            }
            if (!folder) {
                return res.status(404).json({
                    success: false,
                    message: 'Folder not found'
                });
            }
            if (folder.ownerId !== userId && !folder.isPublic) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            res.json({
                success: true,
                data: {
                    folder
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get folder error:', error);
            next(error);
        }
    }
    async updateFolder(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.user;
            const { name, parentId, color, isPublic } = req.body;
            const folder = await this.folderRepository.findById(id);
            if (!folder) {
                return res.status(404).json({
                    success: false,
                    message: 'Folder not found'
                });
            }
            if (folder.ownerId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            const updatedFolder = await this.folderRepository.update(id, {
                name,
                parentId,
                color,
                isPublic
            });
            res.json({
                success: true,
                data: {
                    folder: updatedFolder
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Update folder error:', error);
            next(error);
        }
    }
    async deleteFolder(req, res, next) {
        try {
            const { id } = req.params;
            const { userId } = req.user;
            const folder = await this.folderRepository.findById(id);
            if (!folder) {
                return res.status(404).json({
                    success: false,
                    message: 'Folder not found'
                });
            }
            if (folder.ownerId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }
            await this.folderRepository.delete(id);
            res.json({
                success: true,
                message: 'Folder deleted successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Delete folder error:', error);
            next(error);
        }
    }
}
exports.FoldersController = FoldersController;
//# sourceMappingURL=folders.js.map