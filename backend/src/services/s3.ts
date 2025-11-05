import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/config';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import { Readable } from 'stream';

export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    this.s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId || '',
        secretAccessKey: config.aws.secretAccessKey || '',
      },
    });
    this.bucket = config.aws.s3.bucket;
  }

  async uploadFile(
    file: Buffer,
    key: string,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: mimeType,
        Metadata: metadata,
        ServerSideEncryption: 'AES256',
      });

      await this.s3Client.send(command);
      logger.info(`File uploaded successfully: ${key}`);
      return key;
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      logger.info(`File deleted successfully: ${key}`);
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const presignedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return presignedUrl;
    } catch (error) {
      logger.error('S3 presigned URL error:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  generateFileKey(userId: string, originalName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = originalName.split('.').pop();
    return `uploads/${userId}/${timestamp}-${randomString}.${extension}`;
  }

  async getFileMetadata(key: string): Promise<any> {
    try {
      const command = new GetObjectCommand({
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
    } catch (error) {
      logger.error('S3 metadata error:', error);
      throw new Error('Failed to get file metadata');
    }
  }

  async getFileStream(key: string): Promise<Readable> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      
      if (!response.Body) {
        throw new Error('No file body received from S3');
      }

      return response.Body as Readable;
    } catch (error) {
      logger.error('S3 get file stream error:', error);
      throw new Error('Failed to get file stream from S3');
    }
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
  }
}

export const s3Service = new S3Service();