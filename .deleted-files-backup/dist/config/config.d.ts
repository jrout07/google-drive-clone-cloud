export declare const config: {
    nodeEnv: string;
    port: number;
    database: {
        host: string;
        port: number;
        database: string;
        username: string;
        password: string;
        ssl: boolean;
        pool: {
            min: number;
            max: number;
            acquireTimeoutMillis: number;
            idleTimeoutMillis: number;
        };
    };
    jwt: {
        secret: string;
        expiresIn: string;
        issuer: string;
    };
    aws: {
        region: string;
        accessKeyId: string | undefined;
        secretAccessKey: string | undefined;
        s3: {
            bucket: string;
            region: string;
            presignedUrlExpiry: number;
        };
        cognito: {
            userPoolId: string | undefined;
            clientId: string | undefined;
            region: string;
            issuerUrl: string | undefined;
        };
        secrets: {
            databaseSecret: string;
            jwtSecret: string;
        };
    };
    cors: {
        origins: string[];
    };
    upload: {
        maxFileSize: number;
        allowedMimeTypes: string[];
        tempDir: string;
    };
    logging: {
        level: string;
        format: string;
        enableFile: boolean;
        logDir: string;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
    cache: {
        ttl: number;
        maxSize: number;
    };
    security: {
        bcryptRounds: number;
        sessionSecret: string;
    };
};
export declare const initializeSecrets: () => Promise<void>;
export default config;
//# sourceMappingURL=config.d.ts.map