export declare class S3Service {
    private s3Client;
    private bucket;
    constructor();
    uploadFile(file: Buffer, key: string, mimeType: string, metadata?: Record<string, string>): Promise<string>;
    deleteFile(key: string): Promise<void>;
    getPresignedUrl(key: string, expiresIn?: number): Promise<string>;
    generateFileKey(userId: string, originalName: string): string;
    getFileMetadata(key: string): Promise<any>;
}
export declare const s3Service: S3Service;
//# sourceMappingURL=s3.d.ts.map