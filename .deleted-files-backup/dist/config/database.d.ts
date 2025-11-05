import { Pool } from 'pg';
export declare const connectDatabase: () => Promise<void>;
export declare const getPool: () => Pool;
export declare const closeDatabase: () => Promise<void>;
export declare const healthCheck: () => Promise<boolean>;
export declare const query: (text: string, params?: any[]) => Promise<any>;
export declare const transaction: <T>(callback: (client: any) => Promise<T>) => Promise<T>;
declare const _default: {
    connectDatabase: () => Promise<void>;
    getPool: () => Pool;
    closeDatabase: () => Promise<void>;
    healthCheck: () => Promise<boolean>;
    query: (text: string, params?: any[]) => Promise<any>;
    transaction: <T>(callback: (client: any) => Promise<T>) => Promise<T>;
};
export default _default;
//# sourceMappingURL=database.d.ts.map