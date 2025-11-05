"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Service = exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
class S3Service {
    constructor() {
        this.s3Client = new client_s3_1.S3Client({
            region: config_1.config.aws.region,
            credentials: {
                accessKeyId: config_1.config.aws.accessKeyId || '',
                secretAccessKey: config_1.config.aws.secretAccessKey || '',
            },
        });
        this.bucket = config_1.config.aws.s3.bucket;
    }
    async uploadFile(file, key, mimeType, metadata) {
        try {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file,
                ContentType: mimeType,
                Metadata: metadata,
                ServerSideEncryption: 'AES256',
            });
            await this.s3Client.send(command);
            logger_1.logger.info(`File uploaded successfully: ${key}`);
            return key;
        }
        catch (error) {
            logger_1.logger.error('S3 upload error:', error);
            throw new Error('Failed to upload file to S3');
        }
    }
    async deleteFile(key) {
        try {
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            await this.s3Client.send(command);
            logger_1.logger.info(`File deleted successfully: ${key}`);
        }
        catch (error) {
            logger_1.logger.error('S3 delete error:', error);
            throw new Error('Failed to delete file from S3');
        }
    }
    async getPresignedUrl(key, expiresIn = 3600) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            const presignedUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, {
                expiresIn,
            });
            return presignedUrl;
        }
        catch (error) {
            logger_1.logger.error('S3 presigned URL error:', error);
            throw new Error('Failed to generate presigned URL');
        }
    }
    generateFileKey(userId, originalName) {
        const timestamp = Date.now();
        const randomString = crypto_1.default.randomBytes(8).toString('hex');
        const extension = originalName.split('.').pop();
        return `uploads/${userId}/${timestamp}-${randomString}.${extension}`;
    }
    async getFileMetadata(key) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            const response = await this.s3Client.send(command);
            return {
                contentType: response.ContentType,
                contentLength: response.ContentLength,
                lastModified: response.LastModified,
                metadata: response.Metadata,
            };
        }
        catch (error) {
            logger_1.logger.error('S3 metadata error:', error);
            throw new Error('Failed to get file metadata');
        }
    }
}
exports.S3Service = S3Service;
exports.s3Service = new S3Service();
//# sourceMappingURL=s3.js.map